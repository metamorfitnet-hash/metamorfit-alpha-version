const WORKER_URL = "https://metamorfit-worker-beta.metamorfitnet.workers.dev";

async function run() {
  console.log("Initializing ledger...");
  const initRes = await fetch(`${WORKER_URL}/api/ledger/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer meta_beta_sec_994a8f9c2d1b73e_74561_xyz"
    }
  });
  if (!initRes.ok) {
    console.error("Failed to init ledger", initRes.status);
    return;
  }
  const initData = await initRes.json();
  const userId = initData.userId;
  console.log("Initialized user id:", userId);

  const payload = {
    userId: userId,
    email: "felipecano10@gmail.com",
    fullName: "Felipe Cano",
    tags: ["meal-planner"],
    identity: {
      name: "Felipe Cano",
      age: 28,
      weightKg: 80,
      heightCm: 180,
      goal: "build_muscle",
      bodyType: "mesomorph",
    },
    metabolicProfile: {
      bmr: 1800,
      tdee: 2600,
      targetKcal: 2900,
      proteinGrams: 200,
      carbsGrams: 350,
      fatsGrams: 75,
    },
    personalizationScore: 98,
    meals: [
      {
        id: "meal_1",
        name: "High Protein Breakfast",
        ingredients: [
          { name: "Chicken Breast", quantity: "200g", protein: 60, carbs: 0, fats: 7 },
          { name: "Quinoa", quantity: "150g", protein: 6, carbs: 30, fats: 3 },
          { name: "Spinach", quantity: "100g", protein: 3, carbs: 4, fats: 0 },
        ],
        macros: {
          calories: 500,
          protein: 69,
          carbs: 34,
          fats: 10
        }
      },
      {
        id: "meal_2",
        name: "Steak Dinner",
        ingredients: [
          { name: "Lean Steak", quantity: "250g", protein: 65, carbs: 0, fats: 15 },
          { name: "Sweet Potato", quantity: "200g", protein: 4, carbs: 40, fats: 0 },
        ],
        macros: {
          calories: 600,
          protein: 69,
          carbs: 40,
          fats: 15
        }
      }
    ]
  };

  console.log("Sending payload to /api/generate...");
  console.log("User ID:", payload.userId);
  const res = await fetch(`${WORKER_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error(`FAILED: HTTP ${res.status}`);
    const text = await res.text();
    console.error(text);
  } else {
    const data = await res.json();
    console.log(`SUCCESS! generate returned:`, JSON.stringify(data, null, 2));

    // Now simulate polling
    console.log("Polling /api/ledger/" + payload.userId + " for status update...");
    let attempts = 0;
    while(attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s
      const pollRes = await fetch(`${WORKER_URL}/api/ledger/${payload.userId}`, {
        headers: { 'Authorization': 'Bearer meta_beta_sec_994a8f9c2d1b73e_74561_xyz' }
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        console.log(`Poll ${attempts+1} Status:`, pollData.status);
        if (pollData.status === 'delivered') {
          console.log("✅ Pipeline completed! PDF URL:", pollData.results?.pdfUrl);
          break;
        }
      } else {
        console.log(`Poll ${attempts+1} Failed: HTTP ${pollRes.status}`);
      }
      attempts++;
    }
  }
}

run();
