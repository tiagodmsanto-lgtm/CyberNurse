export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Fallback if env variable isn't properly loaded
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      console.error('Vision API key is not configured on the server');
      return new Response(JSON.stringify({ error: 'Vision API key is not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Vision API returned error:", data.error);
      return new Response(JSON.stringify({ error: data.error.message || 'Vision API Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
