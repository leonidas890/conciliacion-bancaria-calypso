import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ExtractedPayment {
  fecha: string;
  monto: number;
  hora?: string;
  descripcion: string;
  referencia?: string;
  esQR: boolean;
  pagina: number;
  origen: 'pdf';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Process both images and PDFs with Lovable AI vision model
    const payments = await processFileWithAI(file);
    console.log('Extracted payments:', payments.length);
    
    return new Response(JSON.stringify({ 
      success: true,
      payments,
      totalExtracted: payments.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al procesar el PDF',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


function normalizeDateString(dateStr: string): string {
  // Try to parse and normalize to YYYY-MM-DD
  const parts = dateStr.split(/[\/\-]/);
  
  if (parts.length !== 3) return dateStr;
  
  let year, month, day;
  
  // Check if first part is year (4 digits)
  if (parts[0].length === 4) {
    year = parts[0];
    month = parts[1].padStart(2, '0');
    day = parts[2].padStart(2, '0');
  } else {
    // Assume DD/MM/YYYY or DD-MM-YYYY
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  }
  
  return `${year}-${month}-${day}`;
}

async function processFileWithAI(file: File): Promise<ExtractedPayment[]> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY no configurado');
  }

  // Convert image to base64
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binaryString);
  const mimeType = file.type || 'image/jpeg';
  const imageUrl = `data:${mimeType};base64,${base64}`;

  console.log('Calling Lovable AI for image analysis...');

  // Call Lovable AI with vision model
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza esta imagen de voucher de pago y extrae TODA la información de pagos que encuentres.

Para CADA pago que identifiques, extrae:
- fecha (formato DD/MM/YYYY o YYYY-MM-DD)
- monto (número decimal, ej: 1234.56)
- hora (formato HH:MM si está disponible)
- descripción (concepto del pago)
- referencia (número de referencia, ticket o comprobante si existe)
- esQR (true si es un pago QR, false si no lo es)

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "payments": [
    {
      "fecha": "2024-01-15",
      "monto": 1500.50,
      "hora": "14:30",
      "descripcion": "Pago de servicio",
      "referencia": "REF123456",
      "esQR": false
    }
  ]
}

Si la imagen no contiene información de pagos, devuelve: {"payments": []}`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    throw new Error(`Error al analizar imagen con AI: ${response.status}`);
  }

  const aiResult = await response.json();
  console.log('AI response received');

  const content = aiResult.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No se recibió respuesta del modelo AI');
  }

  // Extract JSON from the response (it might be wrapped in markdown code blocks)
  let jsonText = content.trim();
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n');
    jsonText = lines.slice(1, -1).join('\n');
    if (jsonText.startsWith('json')) {
      jsonText = jsonText.substring(4).trim();
    }
  }

  try {
    const parsed = JSON.parse(jsonText);
    const payments: ExtractedPayment[] = (parsed.payments || []).map((p: any, index: number) => ({
      fecha: p.fecha ? normalizeDateString(p.fecha) : new Date().toISOString().split('T')[0],
      monto: parseFloat(p.monto) || 0,
      hora: p.hora || undefined,
      descripcion: p.descripcion || 'Pago extraído de imagen',
      referencia: p.referencia || undefined,
      esQR: p.esQR === true,
      pagina: 1,
      origen: 'pdf' as const,
    }));
    
    return payments;
  } catch (e) {
    console.error('Error parsing AI response:', e, 'Content:', content);
    throw new Error('Error al procesar respuesta del AI');
  }
}
