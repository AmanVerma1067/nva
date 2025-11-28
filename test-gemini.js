
const apiKey = "AIzaSyAiHMTJeMW8X3n_NPNG_crxe30eoEDgrgo"; // ⚠️ PASTE YOUR KEY

async function checkModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log("🔍 Checking available models...");
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      console.log("👉 If the error says 'Method not found' or 'Not Found', YOU MUST ENABLE THE API IN GOOGLE CLOUD CONSOLE.");
      return;
    }

    if (!data.models) {
      console.log("⚠️ No models found. Your API Key might be restricted.");
      return;
    }

    console.log("✅ Success! Your key supports these models:");
    data.models.forEach(m => {
      // Filter for models that support 'generateContent'
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(` - ${m.name.replace("models/", "")}`);
      }
    });

  } catch (err) {
    console.error("Network Error:", err);
  }
}

checkModels();