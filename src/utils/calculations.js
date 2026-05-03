
export const getBestDiscount = (discounts = [], purchase) => {
    if (!Array.isArray(discounts) || !purchase) {
        return {};
    }

    const priorityOrder = [
        "Flat",
        "Branch Basis",
        "Brand Basis",
        "Product Basis",
        "Style Code Basis",
        "Age Basis"
    ];

    let eligible = discounts.filter(discount => {
        const minAmt = parseFloat(discount.Min_Purchase_Amt || "0");
        if (purchase.amount < minAmt) return false;

        switch (discount.Discount_Critiria) {
            case "Flat":
                return true;

            case "Branch Basis":
                // Mock branch check - verify if we have branch info in purchase
                if (!purchase.branchId) return false;
                return discount.Branch_Names?.some(
                    b => b.ID === purchase.branchId || b.display_value === purchase.branchName
                );

            case "Brand Basis":
                if (!purchase.brand) return false;
                return discount.Brands?.split(",").some(
                    b => purchase.brand === b.trim()
                );

            case "Product Basis":
                if (!purchase.productId) return false;
                return discount.Products?.split(",").some(
                    p => purchase.productId === p.trim()
                );

            case "Style Code Basis":
                if (!purchase.styleCode) return false;
                return discount.Style_Codes?.split(",").some(
                    s => purchase.styleCode === s.trim()
                );

            case "Age Basis":
                if (!purchase.productCreatedAt) return false;
                const productCreated = new Date(purchase.productCreatedAt);
                const ageDays =
                    (Date.now() - productCreated.getTime()) / (1000 * 60 * 60 * 24);
                const allowedDays = parseInt(discount.Product_Creation_Date || "0", 10);
                return ageDays <= allowedDays;

            default:
                return false;
        }
    });

    if (eligible.length === 0) return null;

    eligible.sort((a, b) => {
        const diff =
            parseFloat(b.Discount_Percentage || 0) -
            parseFloat(a.Discount_Percentage || 0);

        if (diff !== 0) return diff;

        return (
            priorityOrder.indexOf(a.Discount_Critiria) -
            priorityOrder.indexOf(b.Discount_Critiria)
        );
    });

    return eligible[0];
};

export const calculateTotals = (cart, discount = null) => {
    let totalQty = 0;
    let subTotal = 0;
    let eligibleSubTotal = 0;
    let taxAmt_5 = 0;
    let taxAmt_12 = 0;
    let taxAmt_18 = 0;
    let discountAmt = 0;

    const exclusiveProducts = ["Soft Toys", "Non Battery Toys", "Battery Toys", "Gift Pack"];

    cart.forEach((item) => {
        const qty = parseFloat(item.cartQty || 0);
        const price = parseFloat(item.price || 0);
        const taxRate = parseFloat(item.tax || 0);
        // Trim and normalize category for search
        const category = (item.category || "").trim();

        const amount = qty * price;
        const itemTaxAmt = (amount * (taxRate / 100));

        totalQty += qty;
        subTotal += amount;

        // Check if product is in exclusive categories (case-insensitive check for robustness)
        const isExcluded = exclusiveProducts.some(ex => ex.toLowerCase() === category.toLowerCase());

        if (!isExcluded) {
            eligibleSubTotal += amount;
        }

        if (taxRate === 5) taxAmt_5 += itemTaxAmt;
        else if (taxRate === 12) taxAmt_12 += itemTaxAmt;
        else if (taxRate === 18) taxAmt_18 += itemTaxAmt;
    });

    // Apply Discount
    let discountAppliedName = "";
    if (discount) {
        const percentage = parseFloat(discount.Discount_Percentage || 0);
        const minAmt = parseFloat(discount.Min_Purchase_Amt || 0);

        // Apply discount ONLY if eligible subtotal meets min amount
        if (percentage > 0 && eligibleSubTotal >= minAmt) {
            discountAmt = (eligibleSubTotal * percentage) / 100;
            discountAppliedName = `${discount.Name} (${percentage}%)`;
        }
    }

    // Ensure discount doesn't exceed eligible subtotal
    if (discountAmt > eligibleSubTotal) discountAmt = eligibleSubTotal;

    const afterDiscount = subTotal - discountAmt;
    const totalTax = taxAmt_5 + taxAmt_12 + taxAmt_18;
    const netTotal = afterDiscount + totalTax;

    return {
        totalQty,
        subTotal: parseFloat(subTotal.toFixed(2)),
        eligibleSubTotal: parseFloat(eligibleSubTotal.toFixed(2)),
        taxAmt_5: parseFloat(taxAmt_5.toFixed(2)),
        taxAmt_12: parseFloat(taxAmt_12.toFixed(2)),
        taxAmt_18: parseFloat(taxAmt_18.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        discountAmt: parseFloat(discountAmt.toFixed(2)),
        discountName: discountAppliedName,
        netTotal: Math.round(netTotal)
    };
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};
