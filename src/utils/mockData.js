
export const mockProducts = [
    {
        sku: "RIB1B02PO42",
        product: "Polo",
        price: 599.00,
        qty: 100,
        image: "https://bit.ly/dan-abramov",
        tax: 5,
        category: "Clothing",
        brand: "Polo",
        styleCode: "PO42",
        createdAt: "2023-01-01"
    },
    {
        sku: "RIB1B02PO40",
        product: "Polo Red",
        price: 499.00,
        qty: 50,
        image: "https://bit.ly/ryan-florence",
        tax: 5,
        category: "Clothing",
        brand: "Polo",
        styleCode: "PO40",
        createdAt: "2023-06-01"
    },
    {
        sku: "TOY123",
        product: "Soft Toy Bear",
        price: 299.00,
        qty: 20,
        image: "https://bit.ly/prosper-baba",
        tax: 12,
        category: "Soft Toys",
        brand: "ToyCo",
        styleCode: "TOY01",
        createdAt: "2024-01-01"
    },
    {
        sku: "TOY456",
        product: "Battery Car",
        price: 1299.00,
        qty: 15,
        image: "https://bit.ly/ryan-florence",
        tax: 12,
        category: "Battery Toys",
        brand: "ToyCo",
        styleCode: "TOY02",
        createdAt: "2024-02-01"
    }
];

export const mockCustomers = [
    {
        id: "CUST001",
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        wallet: 150.00,
        children: [
            { name: "Jr Doe", dob: "2015-05-15", gender: "Boy" }
        ]
    },
    {
        id: "CUST002",
        name: "Jane Smith",
        phone: "9123456789",
        email: "jane@example.com",
        wallet: 0.00,
        children: []
    },
    {
        id: "CUST003",
        name: "Alice Johnson",
        phone: "9988776655",
        email: "alice@example.com",
        wallet: 50.00
    },
    {
        id: "CUST004",
        name: "Bob Brown",
        phone: "8877665544",
        email: "bob@example.com",
        wallet: 200.00
    },
    {
        id: "CUST005",
        name: "Charlie Davis",
        phone: "7766554433",
        email: "charlie@example.com",
        wallet: 10.00
    },
    {
        id: "CUST006",
        name: "Diana Evans",
        phone: "6655443322",
        email: "diana@example.com",
        wallet: 75.00
    },
    {
        id: "CUST007",
        name: "Ethan Foster",
        phone: "5544332211",
        email: "ethan@example.com",
        wallet: 120.00
    },
    {
        id: "CUST008",
        name: "Fiona Green",
        phone: "9876501234",
        email: "fiona@example.com",
        wallet: 0.00
    },
    {
        id: "CUST009",
        name: "George Harris",
        phone: "9123405678",
        email: "george@example.com",
        wallet: 30.00
    },
    {
        id: "CUST010",
        name: "Hannah Ivy",
        phone: "9012345678",
        email: "hannah@example.com",
        wallet: 90.00
    }
];

export const mockDiscounts = [
    {
        id: "DISC001",
        Name: "Flat 10% Off",
        Discount_Critiria: "Flat",
        Discount_Percentage: 20,
        Min_Purchase_Amt: 2999
    },
    {
        id: "DISC002",
        Name: "Brand Sale",
        Discount_Critiria: "Brand Basis",
        Brands: "Polo, Nike",
        Discount_Percentage: 30,
        Min_Purchase_Amt: 4999
    }
];
