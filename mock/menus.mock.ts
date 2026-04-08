import { Menu } from "@/types/menu.type";

export const menusData = [
    {
        _id: "mnu_001",
        id: "mnu_001",
        name: "Coffee Combo",
        type: "ready_to_serve",
        category: "Beverages",
        description: "Cold Coffee + Cheese Sandwich combo offer",
        menuFor: "model",
        associatedModelIds: ["model_chaos_001"],
        status: "active",
        isDeleted: false,
        recipes: [
            {
                recipeId: "recipe_001",
                quantity: 1,
                unit: "cup",
                cost: 22.88,
            },
            {
                recipeId: "recipe_002",
                quantity: 1,
                unit: "pcs",
                cost: 45.88,
            },
        ],
        modifiers: [
            {
                name: "Size Options",
                required: false,
                type: "rawMaterial",
                rawMaterialId: "rm_size",
                options: [
                    {
                        label: "Medium Size",
                        quantity: 1,
                        unit: "serving",
                        unitPricing: {
                            unitCost: 0,
                            unitSellPrice: 0,
                            unitFinalPrice: 0,
                        },
                    },
                    {
                        label: "Large Size",
                        quantity: 1,
                        unit: "serving",
                        unitPricing: {
                            unitCost: 10,
                            unitSellPrice: 30,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 1.5,
                            },
                            unitFinalPrice: 31.5,
                            profitMargin: 66.67,
                        },
                    },
                ],
            },
            {
                name: "Add-ons",
                required: false,
                type: "recipe",
                recipeId: "recipe_addon",
                options: [
                    {
                        label: "Ice Cream Scoop",
                        quantity: 1,
                        unit: "scoop",
                        unitPricing: {
                            unitCost: 15,
                            unitSellPrice: 35,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 1.75,
                            },
                            unitFinalPrice: 36.75,
                            profitMargin: 57.14,
                        },
                    },
                    {
                        label: "Extra Cheese",
                        quantity: 1,
                        unit: "slice",
                        unitPricing: {
                            unitCost: 5,
                            unitSellPrice: 8,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 0.4,
                            },
                            unitFinalPrice: 8.4,
                            profitMargin: 37.5,
                        },
                    },
                ],
            },
        ],
        basePricing: {
            baseCost: 67.88,
            sellPrice: 149,
            taxInfo: {
                taxType: "GST",
                taxPercentage: 5,
                taxAmount: 7.45,
            },
            finalPrice: 156.45,
            profitMargin: 56,
        },
        customPricing: [
            {
                appliesTo: "franchise",
                franchiseId: "franchise_mumbai_001",
                pricing: {
                    sellPrice: 159,
                    finalPrice: 166.95,
                },
            },
            {
                appliesTo: "franchise",
                franchiseId: "franchise_pune_001",
                pricing: {
                    sellPrice: 145,
                    finalPrice: 152.25,
                },
            },
        ],
        mediaInfo: {
            thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=CoffeeCombo",
            images: [
                "https://api.dicebear.com/7.x/avataaars/svg?seed=CoffeeCombo1",
                "https://api.dicebear.com/7.x/avataaars/svg?seed=CoffeeCombo2",
            ],
        },
        createdBy: "admin_001",
        createdAt: "2024-01-05T10:00:00Z",
        updatedAt: "2024-01-25T14:30:00Z",
    },
    {
        _id: "mnu_002",
        id: "mnu_002",
        name: "Mocha Special",
        type: "made_to_order",
        category: "Beverages",
        description: "Premium Mocha with extra chocolate and whipped cream",
        menuFor: "franchise",
        associatedFranchiseIds: ["franchise_mumbai_001", "franchise_delhi_001"],
        status: "active",
        isDeleted: false,
        recipes: [
            {
                recipeId: "recipe_mocha",
                quantity: 1,
                unit: "cup",
                cost: 45.50,
            },
        ],
        modifiers: [
            {
                name: "Size",
                required: true,
                type: "rawMaterial",
                rawMaterialId: "rm_cup",
                options: [
                    {
                        label: "Small",
                        quantity: 1,
                        unit: "cup",
                        unitPricing: {
                            unitCost: 0,
                            unitSellPrice: 0,
                            unitFinalPrice: 0,
                        },
                    },
                    {
                        label: "Medium",
                        quantity: 1,
                        unit: "cup",
                        unitPricing: {
                            unitCost: 5,
                            unitSellPrice: 20,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 1,
                            },
                            unitFinalPrice: 21,
                            profitMargin: 75,
                        },
                    },
                    {
                        label: "Large",
                        quantity: 1,
                        unit: "cup",
                        unitPricing: {
                            unitCost: 10,
                            unitSellPrice: 40,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 2,
                            },
                            unitFinalPrice: 42,
                            profitMargin: 75,
                        },
                    },
                ],
            },
            {
                name: "Toppings",
                required: false,
                type: "recipe",
                recipeId: "recipe_topping",
                options: [
                    {
                        label: "Extra Whipped Cream",
                        quantity: 1,
                        unit: "serving",
                        unitPricing: {
                            unitCost: 8,
                            unitSellPrice: 20,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 1,
                            },
                            unitFinalPrice: 21,
                            profitMargin: 60,
                        },
                    },
                    {
                        label: "Chocolate Syrup",
                        quantity: 2,
                        unit: "pump",
                        unitPricing: {
                            unitCost: 3,
                            unitSellPrice: 10,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 0.5,
                            },
                            unitFinalPrice: 10.5,
                            profitMargin: 70,
                        },
                    },
                ],
            },
        ],
        basePricing: {
            baseCost: 45.50,
            sellPrice: 180,
            taxInfo: {
                taxType: "GST",
                taxPercentage: 5,
                taxAmount: 9,
            },
            finalPrice: 189,
            profitMargin: 74.72,
        },
        customPricing: [
            {
                appliesTo: "franchise",
                franchiseId: "franchise_mumbai_001",
                pricing: {
                    sellPrice: 185,
                    finalPrice: 194.25,
                },
            },
        ],
        mediaInfo: {
            thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=MochaSpecial",
            images: [
                "https://api.dicebear.com/7.x/avataaars/svg?seed=MochaSpecial1",
            ],
        },
        createdBy: "admin_001",
        createdAt: "2024-01-10T09:00:00Z",
        updatedAt: "2024-01-25T11:20:00Z",
    },
    {
        _id: "mnu_003",
        id: "mnu_003",
        name: "Margherita Pizza",
        type: "made_to_order",
        category: "Main Course",
        description: "Classic Italian pizza with fresh mozzarella and basil",
        menuFor: "model",
        associatedModelIds: ["model_chaos_001", "model_signature_001"],
        status: "active",
        isDeleted: false,
        recipes: [
            {
                recipeId: "recipe_pizza_base",
                quantity: 1,
                unit: "piece",
                cost: 35,
            },
            {
                recipeId: "recipe_pizza_sauce",
                quantity: 100,
                unit: "gram",
                cost: 15,
            },
            {
                recipeId: "recipe_mozzarella",
                quantity: 150,
                unit: "gram",
                cost: 60,
            },
        ],
        modifiers: [
            {
                name: "Size",
                required: true,
                type: "rawMaterial",
                rawMaterialId: "rm_pizza",
                options: [
                    {
                        label: "Regular (8 inch)",
                        quantity: 1,
                        unit: "piece",
                        unitPricing: {
                            unitCost: 0,
                            unitSellPrice: 0,
                            unitFinalPrice: 0,
                        },
                    },
                    {
                        label: "Medium (10 inch)",
                        quantity: 1,
                        unit: "piece",
                        unitPricing: {
                            unitCost: 25,
                            unitSellPrice: 80,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 4,
                            },
                            unitFinalPrice: 84,
                            profitMargin: 68.75,
                        },
                    },
                    {
                        label: "Large (12 inch)",
                        quantity: 1,
                        unit: "piece",
                        unitPricing: {
                            unitCost: 45,
                            unitSellPrice: 150,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 7.5,
                            },
                            unitFinalPrice: 157.5,
                            profitMargin: 70,
                        },
                    },
                ],
            },
            {
                name: "Extra Toppings",
                required: false,
                type: "rawMaterial",
                rawMaterialId: "rm_toppings",
                options: [
                    {
                        label: "Extra Cheese",
                        quantity: 1,
                        unit: "portion",
                        unitPricing: {
                            unitCost: 20,
                            unitSellPrice: 50,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 2.5,
                            },
                            unitFinalPrice: 52.5,
                            profitMargin: 60,
                        },
                    },
                    {
                        label: "Olives",
                        quantity: 1,
                        unit: "portion",
                        unitPricing: {
                            unitCost: 15,
                            unitSellPrice: 40,
                            taxInfo: {
                                taxType: "GST",
                                taxPercentage: 5,
                                taxAmount: 2,
                            },
                            unitFinalPrice: 42,
                            profitMargin: 62.5,
                        },
                    },
                ],
            },
        ],
        basePricing: {
            baseCost: 110,
            sellPrice: 299,
            taxInfo: {
                taxType: "GST",
                taxPercentage: 5,
                taxAmount: 14.95,
            },
            finalPrice: 313.95,
            profitMargin: 63.21,
        },
        mediaInfo: {
            thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pizza",
            images: [
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Pizza1",
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Pizza2",
            ],
        },
        createdBy: "admin_001",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-20T14:30:00Z",
    },
];

