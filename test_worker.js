const payload = {
  "fullName": "System Test Consolidation",
  "email": "test@metamorfit.pro",
  "identity": { "name": "System Test", "bodyType": "Mesomorph", "goal": "Fat Loss" },
  "metabolicProfile": { "tdee": 2600, "proteinGrams": 180, "carbsGrams": 250, "fatsGrams": 70, "activityLevel": "Moderate" },
  "personalization": { "personalizationScore": 88 },
  "notes": [
    { "category": "protein", "whyThisMatters": "Satiety and muscle retention.", "howToApplyToday": "Eat greek yogurt." }
  ],
  "meals": [
    { 
      "name": "Breakfast", 
      "ingredients": [ 
        { "name": "Eggs", "amount": "3", "unit": "large", "protein": 18, "carbs": 1, "fats": 15, "calories": 210 } 
      ], 
      "protein": 18, 
      "carbs": 1, 
      "fats": 15, 
      "calories": 210 
    }
  ]
};

async function test() {
  const token = "BETA_TEST_TOKEN"; // I'll try this as a placeholder or check if I can find the real one
  const response = await fetch("https://metamorfit-worker.metamorfitnet.workers.dev/api/send-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  console.log(await response.text());
}

test();
