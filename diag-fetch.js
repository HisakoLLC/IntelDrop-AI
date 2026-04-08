const API_KEY = "AIzaSyD6CKwdDQ_KNzGuCvAXv3tD2yI_ikmHJjk";

async function listModels() {
  try {
    console.log("Checking API v1beta...");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await res.json();

    if (data.models) {
      console.log("--- V1BETA MODEL LIST ---");
      data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } else {
      console.log("No models found. Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

listModels();
