export const RECIPES_DATA = [
    {
        "id": "rec_001",
        "status": "Active",
        "createdAt": "2025-12-10T10:00:00Z",
        "updatedAt": "2025-12-10T10:00:00Z",
        "createdBy": {
            "id": "user_101",
            "name": "Amit Sharma"
        },
        "updatedBy": {
            "id": "user_101",
            "name": "Amit Sharma"
        },
        "basicInfo": {
            "recipeName": "Masala Chai",
            "recipeType": "Ready-to-Serve",
            "category": "Beverage",
            "preparationTime": 10,
            "description": "A hot Indian spiced tea brewed with milk and aromatic spices.",
            "costPerRecipe": 15
        },
        "ingredientsList": [
            { "ingredientName": "Tea Leaves", "quantity": 10, "unit": "g", "sourceStock": "Raw Stock" },
            { "ingredientName": "Milk", "quantity": 200, "unit": "ml", "sourceStock": "Dairy" },
            { "ingredientName": "Sugar", "quantity": 20, "unit": "g", "sourceStock": "Raw Stock" },
            { "ingredientName": "Masala Mix", "quantity": 5, "unit": "g", "sourceStock": "Raw Stock" }
        ],
        "preparationSteps": [
            { "stepNumber": 1, "description": "Boil water with tea leaves and masala." },
            { "stepNumber": 2, "description": "Add milk and sugar; simmer for 3–4 minutes." },
            { "stepNumber": 3, "description": "Strain and serve hot." }
        ],
        "nutritionalInfo": {
            "calories": 120,
            "protein": 3,
            "carbs": 18,
            "fat": 4
        },
        "mediaVisuals": {
            "recipeImage": ["https://cdn.example.com/masala-chai.jpg"],
            "videoTutorial": ["https://cdn.example.com/masala-chai.mp4"]
        }
    },

    {
        "id": "rec_002",
        "status": "Draft",
        "createdAt": "2025-12-10T10:30:00Z",
        "updatedAt": "2025-12-10T10:30:00Z",
        "createdBy": {
            "id": "user_102",
            "name": "Priya Verma"
        },
        "updatedBy": {
            "id": "user_102",
            "name": "Priya Verma"
        },
        "basicInfo": {
            "recipeName": "Paneer Tikka Roll",
            "recipeType": "Made-to-Order",
            "category": "Snack",
            "preparationTime": 25,
            "description": "Grilled paneer wrapped in a soft roti with veggies & sauces.",
            "costPerRecipe": 45
        },
        "ingredientsList": [
            { "ingredientName": "Paneer", "quantity": 100, "unit": "g", "sourceStock": "Dairy" },
            { "ingredientName": "Roti", "quantity": 1, "unit": "piece", "sourceStock": "Bakery" },
            { "ingredientName": "Veggies Mix", "quantity": 50, "unit": "g", "sourceStock": "Fresh Stock" },
            { "ingredientName": "Tikka Masala", "quantity": 10, "unit": "g", "sourceStock": "Raw Stock" }
        ],
        "preparationSteps": [
            { "stepNumber": 1, "description": "Marinate paneer with tikka masala and yogurt." },
            { "stepNumber": 2, "description": "Grill until lightly charred." },
            { "stepNumber": 3, "description": "Place grilled paneer on roti with veggies." },
            { "stepNumber": 4, "description": "Roll tightly and serve." }
        ],
        "nutritionalInfo": {
            "calories": 350,
            "protein": 18,
            "carbs": 28,
            "fat": 15
        },
        "mediaVisuals": {
            "recipeImage": ["https://cdn.example.com/paneer-tikka-roll.jpg"],
            "videoTutorial": []
        }
    },

    {
        "id": "rec_003",
        "status": "Inactive",
        "createdAt": "2025-12-10T11:00:00Z",
        "updatedAt": "2025-12-10T11:00:00Z",
        "createdBy": {
            "id": "user_103",
            "name": "Rahul Singh"
        },
        "updatedBy": {
            "id": "user_103",
            "name": "Rahul Singh"
        },
        "basicInfo": {
            "recipeName": "Chocolate Mousse",
            "recipeType": "Ready-to-Serve",
            "category": "Dessert",
            "preparationTime": 20,
            "description": "A rich and creamy chocolate dessert with whipped texture.",
            "costPerRecipe": 60
        },
        "ingredientsList": [
            { "ingredientName": "Dark Chocolate", "quantity": 100, "unit": "g", "sourceStock": "Raw Stock" },
            { "ingredientName": "Whipping Cream", "quantity": 150, "unit": "ml", "sourceStock": "Dairy" },
            { "ingredientName": "Sugar", "quantity": 20, "unit": "g", "sourceStock": "Raw Stock" }
        ],
        "preparationSteps": [
            { "stepNumber": 1, "description": "Melt chocolate over a double boiler." },
            { "stepNumber": 2, "description": "Whip cream and sugar until soft peaks." },
            { "stepNumber": 3, "description": "Fold melted chocolate into whipped cream." },
            { "stepNumber": 4, "description": "Refrigerate for 2 hours before serving." }
        ],
        "nutritionalInfo": {
            "calories": 420,
            "protein": 5,
            "carbs": 35,
            "fat": 30
        },
        "mediaVisuals": {
            "recipeImage": ["https://cdn.example.com/chocolate-mousse.jpg"],
            "videoTutorial": ["https://cdn.example.com/chocolate-mousse.mp4"]
        }
    }
];
