export function onInit(quoteLineModels, conn) {
    return Promise.resolve();
}

// NOVACPQ-212 Discount Type
export function isFieldEditableForObject(fieldName, quote, conn, objectName) {
    if (objectName == "Quote__c" && fieldName == "Discount_Type__c") {
        if (
            quote.SBQQ__Status__c != CONSTANTS.QUOTE_STATUS.PENDING ||
            quote.Is_MarketPlace_Quote__c == true ||
            (quote.SBQQ__Type__c == "Renewal" && quote.isDisti_Or_IsReseller_Quote__c != CONSTANTS.IS_DISTI_OR_RESELLER_QUOTE.IS_DISTI_QUOTE)
        ) {
            return false;
        }
    }
    if (objectName == "Quote__c" && fieldName == "Billing_Frequency__c") {
        if (quote.is_Sales_Rep__c) return false;
    }
    //NOVACPQ-1127 and NOVACPQ-1452: MCR - Lock Quote.EndDate header field on QLE for NB, Amendments and Cortex
    if (
        objectName == "Quote__c" &&
        fieldName == "SBQQ__EndDate__c" &&
        (
            quote.SBQQ__Type__c != "Renewal" ||
            quote.Opportunity_Main_Speedboat_Type__c != "Prisma")
    ) {
        return false;
    }
}

export function isFieldEditable(fieldName, qlr, conn) {
    var today = new Date();
    //MDQ Locking fields if segment is past dated or segment is future dated
    if (qlr.SBQQ__EndDate__c != null) {
        var endDate = new Date(qlr.SBQQ__EndDate__c);
        if (endDate <= today) {
            return false;
        }
    }
    if (qlr.InactiveSegment__c) {
        if (fieldName === 'Process_Date__c') {
            return false;
        }
    }
    //This is to hide the First Billing Amount on MDQ Quotes
    var sgFooter = document.getElementsByClassName("tfoot style-scope sf-segmented-table");

    if (sgFooter && qlr.SBQQ__SegmentIndex__c != null) {
        for (var i = 0; i < sgFooter.length; i++) {

            sgFooter[i].style.display = "none";
        }
    }
    if (qlr.QLE_Lock_Fields__c && qlr.QLE_Lock_Fields__c.indexOf(fieldName) >= 0) {
        return false;
    }

    if (fieldName === "Core_Speciality__c" && CONSTANTS.EXTENDED_EXPERTISEPS_SKU.indexOf(qlr.Internal_SKU_Name__c) >= 0) {
        return true;
    }

    // Locking Editing of processdate on Upgraded Line -MidtermUpgrades
    if (qlr.Upgraded_From_Quote_Line__c != null && fieldName === "Process_Date__c") {
        return false;
    }

    //Lock Quantity for non sales reps for wildcard PS sku as per NOVACPQ-1174 and  NOVACPQ-1176-Changing the condition to check only PRJM DAY sku
    if (fieldName === 'SBQQ__Quantity__c' && (CONSTANTS.PAN_CONSULT_PRJM_DAY === qlr.Internal_SKU_Name__c && qlr.SBQQ__Quote__r.is_Sales_Rep__c === false && qlr.SBQQ__Quote__r.is_Sales_Ops__c === false)) {
        return false;
    }

    //Lock total discount for sales reps for ps sku's and Crypsis skus
    if (fieldName === "Total_Discount__c" && (CONSTANTS.PS_APPROVAL_CATEGORY.indexOf(qlr.Approval_Category__c) >= 0 || CONSTANTS.CRYPSIS_SKU_LIST.indexOf(qlr.Internal_SKU_Name__c) >= 0) &&
        qlr.SBQQ__Quote__r != null && qlr.SBQQ__Quote__r.is_Sales_Rep__c === true) {
        return false;
    }

    // Locking the End date for upgraded Subscriptions to support Amend and Extend Functionality
    if (
        qlr.Is_Cloned__c === false && fieldName === "SBQQ__EndDate__c" &&
        ((qlr.SBQQ__UpgradedSubscription__c != null) || (qlr.SBQQ__UpgradedAsset__c != null) || ((qlr.SBQQ__UpgradedSubscription__c == null || qlr.SBQQ__UpgradedAsset__c == null) && qlr.Product_Group__c == CONSTANTS.DEMISTOPG) || (CONSTANTS.PS_APPROVAL_CATEGORY.indexOf(qlr.Approval_Category__c) >= 0))
    ) {
        return false;
    }

    if (qlr.Is_Cloned__c === true && fieldName === "SBQQ__EndDate__c") {
        if (
            CONSTANTS.REDLOCKSUPPORT.indexOf(qlr.SBQQ__ProductCode__c) >= 0 ||
            CONSTANTS.TWISTLOCKSUPPORT.indexOf(qlr.SBQQ__ProductCode__c) >= 0 ||
            CONSTANTS.DEMISTOSUPPORT.indexOf(qlr.SBQQ__ProductCode__c) >= 0
        ) {
            return false;
        }
    }

    // Locking the Process date for cloned quote lines to support Amend and Extend Functionality
    if (
        qlr.Is_Cloned__c === true &&
        fieldName === "Process_Date__c" &&
        (qlr.SBQQ__UpgradedSubscription__c === null || CONSTANTS.PS_APPROVAL_CATEGORY.indexOf(qlr.Approval_Category__c) >= 0)
    ) {
        return false;
    }

    //debug("#####isFieldEditable:Product Code .... " + qlr.SBQQ__ProductCode__c + ' - isFieldEditable enter ' );

    //NOVACPQ-1126, NOVACPQ-1452 and NOVACPQ-1436
    if (
        qlr.SBQQ__ProductCode__c !== null &&
        qlr.IsWrapperSKU__c === false &&
        qlr.SBQQ__SegmentKey__c === null
    ) {
        //lock end date for Prisma and cortex both
        if (fieldName === "SBQQ__EndDate__c" && qlr.SBQQ__Quote__r.SBQQ__Type__c === 'Renewal')
            return false;
        if (
            (
                fieldName === "SBQQ__SubscriptionTerm__c" ||
                fieldName === "Process_Date__c" ||
                fieldName === 'SBQQ__EndDate__c') &&
            (
                CONSTANTS.REDLOCKPG === qlr.Product_Group__c ||
                CONSTANTS.TWISTLOCKPG === qlr.Product_Group__c)
        )
            return false;
    }

    /*MCR: NOVACPQ-1452 Added Start Date and made it editable */
    if (
        fieldName === "SBQQ__StartDate__c" &&
        qlr.IsWrapperSKU__c === true &&
        qlr.SBQQ__Quote__r.SBQQ__Type__c == "Renewal" &&
        qlr.SBQQ__SegmentKey__c === null &&
        qlr.Related_Subscription__c == null
    ) {
        return true;
    }

    if (
        fieldName === "SBQQ__EndDate__c" ||
        fieldName === "SBQQ__Quantity__c" ||
        fieldName === "Process_Date__c" ||
        ((fieldName === "Total_Discount__c" || fieldName === "SBQQ__SubscriptionTerm__c" || fieldName === "Region__c") && qlr.Upgraded_To_Quote_Line__c == null)
    ) {
        return true;
    }
    if (fieldName === "Override_Net_Total__c" && qlr.SBQQ__Quote__r !== null) {
        var isPricingOverrideEnabled = qlr.SBQQ__Quote__r.Is_Price_Override_Enabled__c;
        return isPricingOverrideEnabled;
    }

    // Locking Editing of total discount on Upgraded Line -MidtermUpgrades
    if (qlr.Upgraded_To_Quote_Line__c != null && fieldName === "Total_Discount__c") {
        return false;
    }

    return false;
}

export function onBeforeCalculate(quoteModel, quoteLines, conn) {
    var pricingDirective = quoteModel.record["Pricing_Directive__c"];
    var quoteStatus = quoteModel.record["SBQQ__Status__c"];

    if (!quoteHasXdrPotProducts(quoteModel, quoteLines) && quoteStatus !== CONSTANTS.QUOTE_STATUS.PENDING &&
        (pricingDirective == null || pricingDirective.indexOf(CONSTANTS.PRICING_DIRECTIVE.AFTER_PENDING) < 0)) {
        return Promise.resolve();
    }
    var qt = quoteModel;
    var today = new Date();
    var isSegmented = false;
    var psSkuBaseTerm = 12;
    var isBundleSegmented = false;
    var psSkuBaseTerm = 12;
    var xdrSegmented = false;
    var demistoSegmented = false;
    var validSegment = true;


    debug("###### onBeforeCalculate: enter ");
    if (quoteLines != null && quoteModel != null) {
        var quoteCreatedDate = Date.parse(qt.record["CreatedDate"] + "");
        var quoteCutoffDate = Date.parse(CONSTANTS.VOLUMEDISCOUNTCUTOFFDATE);
        if (quoteModel.record.SBQQ__Type__c == 'Amendment' && quoteModel.record.MDQScore__c > 0) {
            debug('###### onBeforeCalculate: Entered the MDQ Amendment ');
            quoteLines.forEach(function(lineWrapper) {
                var line = lineWrapper.record;
                var lineEndDate = new Date(line.SBQQ__EndDate__c);

                debug('###### onBeforeCalculate: Entered the MDQ Amendment line contract is : ' + JSON.stringify(line.OriginalContractEndDate__c));
                if (line.OriginalContractEndDate__c != null && line.OriginalContractEndDate__c < line.SBQQ__EffectiveStartDate__c && !line.Is_Cloned__c) {
                    debug('###### onBeforeCalculate: Entered the MDQ Amendment Got the candidate');
                    if (line.SBQQ__SubscriptionPricing__c != 'Percent Of Total') {
                        line.Total_Quantity__c = 0;
                        line.SBQQ__PriorQuantity__c = 0;
                        line.SBQQ__Quantity__c = 0;
                    }
                    //NOVACPQ-1372
                    if (line.SBQQ__UpgradedSubscription__c != null && line.Related_Subscription__c == null)
                        line.Related_Subscription__c = line.SBQQ__UpgradedSubscription__c;
                    line.InactiveSegment__c = true;
                    line.Is_Cloned__c = true;
                }
            });
        }

        var hasBacklineProducts = false;
        quoteLines.forEach((lineWrapper) => {
            var line = lineWrapper.record;
            debug("###### onBeforeCalculate:  checking backline " + line.Supports_BackLine__c);
            if (line.SBQQ__ProductFamily__c === 'Professional Services' && line.Internal_SKU_Name__c != null && line.Internal_SKU_Name__c.startsWith("PAN-CONSULT-EE") && line.IsWrapperSKU__c) {
                psSkuBaseTerm = line.SBQQ__SubscriptionTerm__c;
            }



            if (line.Supports_BackLine__c == true || (line.Support_Type__c != null && line.Support_Type__c.indexOf(CONSTANTS.SUPPORTTYPE) > 0)) {

                debug("###### onBeforeCalculate:  checking backline boolean " + line.Supports_BackLine__c);
                hasBacklineProducts = true;
            }
            if (line.Last_Edited_Term__c == null) {
                line.Last_Edited_Term__c = line.SBQQ__SubscriptionTerm__c;
                debug("getUpdatedTerm: clast editedd term is null updated to " + line.SBQQ__SubscriptionTerm__c);
            }
        });
        if (hasBacklineProducts) {
            var ascLookupId = qt.record["Authorized_Support_Center__c"];
            setASCValue(conn, qt, ascLookupId);
            debug("###### onBeforeCalculate:  checking backline asc using lookup " + ascLookupId);
        } else {
            debug("###### onBeforeCalculate:  no backline productts found ");
            qt.record["ASC__c"] = null;
            qt.record["ASC_Name__c"] = null;
            qt.record["Authorized_Support_Center__c"] = null;
            debug("###### onBeforeCalculate:  no backline productts found. initialized null values for asc lookup");
        }
        debug("###### onBeforeCalculate:  checking backline support completed ");
        quoteLines.forEach(function(line) {
            var ql = line;
            var sku = getProductSKU(line);
            var hasRegion = false;
            line.record.Product_Code__c = line.record.SBQQ__ProductCode__c;
            if (CONSTANTS.EXTENDED_EXPERTISEPS_MONTH_SKU.indexOf(sku) >= 0) {
                ql.record["Term__c"] = '1';
            }

            if (line.record.IsWrapperSKU__c) {
                (getAllComponents)(line).forEach(function(comp) {
                    if (comp.record.SBQQ__SegmentKey__c != null) {
                        isBundleSegmented = true;
                    }

                    if (comp.record.Internal_SKU_Name__c.indexOf('ENTERPRISE') >= 0 || comp.record.Product_Group__c != null && comp.record.Product_Group__c.indexOf('REDLOCK') >= 0) {
                        hasRegion = true;
                    }
                    if (comp.record.QLE_Lock_Fields__c != null && comp.record.SBQQ__SubscriptionPricing__c != null && comp.record.SBQQ__SubscriptionPricing__c != 'Percent Of Total' && !comp.record.QLE_Lock_Fields__c.includes('SBQQ__DefaultQuantity__c') && (comp.record.Product_Group__c == 'XDR' || comp.record.Product_Group__c == 'Demisto')) {
                        comp.record.QLE_Lock_Fields__c = comp.record.QLE_Lock_Fields__c.replace('SBQQ__Quantity__c', '');
                        if (!comp.record.InactiveSegment__c && quoteModel.record.SBQQ__Type__c == 'Amendment') {
                            comp.record.QLE_Lock_Fields__c = comp.record.QLE_Lock_Fields__c.replace('Process_Date__c', '');
                        }
                    }
                });

                if (hasRegion == false && line.record.QLE_Lock_Fields__c != null && !line.record.QLE_Lock_Fields__c.includes('Region__c')) {
                    line.record.QLE_Lock_Fields__c = line.record.QLE_Lock_Fields__c + ',Region__c';
                } else if (hasRegion == true) {
                    line.record.QLE_Lock_Fields__c = line.record.QLE_Lock_Fields__c.replace('Region__c', '');
                }

                // setProcessDate(quoteModel, quoteLines);
                //loop into the components for this bundle
                getAllComponents(line).forEach(function(comp) {
                    if (validSegment && comp.record.SBQQ__SubscriptionPricing__c != null && !comp.record.IsWrapperSKU__c) {

                        if (isBundleSegmented && comp.record.SBQQ__SegmentKey__c == null) {
                            validSegment = false;
                        }
                    }
                    if (comp.record.SBQQ__ProductFamily__c !== 'Professional Services' && comp.record.SBQQ__ProductFamily__c !== 'Training') {
                        comp.record.Region__c = line.record.Region__c;
                        if (comp.record.SBQQ__SegmentKey__c == null) {
                            comp.record.Process_Date__c = line.record.Process_Date__c; // MCR: NOCACPQ-1368 Process Date
                            comp.record.SBQQ__SubscriptionTerm__c = line.record.SBQQ__SubscriptionTerm__c;
                            console.log('Extended_End_Date__c>>', comp.record.Extended_End_Date__c);
                            if (quoteModel.record.SBQQ__Type__c == 'Amendment' && comp.record.Extended_End_Date__c != null) {
                                comp.record.SBQQ__EndDate__c = comp.record.Extended_End_Date__c;
                                line.record.SBQQ__EndDate__c = comp.record.Extended_End_Date__c;
                                console.log('comp.record.SBQQ__EndDate__c ', comp.record.SBQQ__EndDate__c);
                            } else {
                                comp.record.SBQQ__EndDate__c = line.record.SBQQ__EndDate__c; // MCR:NOVACPQ-1436 Roll End Date from Parent to child lines
                            }
                            console.log('Process_Date__c', comp.record.Process_Date__c);
                            if (quoteModel.record.SBQQ__Type__c == 'Amendment' && line.record.Process_Date__c != null && line.record.Extended_Start_Date__c != null && line.record.Process_Date__c < line.record.Extended_Start_Date__c) {
                                comp.record.Process_Date__c = line.record.Extended_Start_Date__c;
                                line.record.Process_Date__c = line.record.Extended_Start_Date__c;
                                console.log('comp.record.Extended_Start_Date__c ', comp.record.Extended_Start_Date__c);
                            }
                            if (quoteModel.record.SBQQ__Type__c == 'Amendment' && line.record.Process_Date__c != null && line.record.Process_Date__c > line.record.SBQQ__EndDate__c) {
                                comp.record.Process_Date__c = line.record.Extended_Start_Date__c; //new Date();
                                line.record.Process_Date__c = line.record.Extended_Start_Date__c; //new Date();
                                console.log('Process_Date__c>>', comp.record.Process_Date__c);
                            }
                            comp.record.Is_Cloned__c = line.record.Is_Cloned__c;
                            if (comp.record.QLE_Lock_Fields__c != null && !comp.record.QLE_Lock_Fields__c.includes('SBQQ__Quantity__c') && comp.record.SBQQ__SubscriptionPricing__c != null && (comp.record.Product_Group__c.indexOf('XDR') >= 0 || comp.record.Product_Group__c == 'Demisto' || comp.record.Product_Group__c == 'XSOAR NFR')) {
                                comp.record.QLE_Lock_Fields__c = comp.record.QLE_Lock_Fields__c + ',SBQQ__Quantity__c';

                            }
                        }
                    }
                    if (comp.record.SBQQ__ProductFamily__c === 'Professional Services' && comp.record.Internal_SKU_Name__c != null && comp.record.Internal_SKU_Name__c.startsWith("PAN-CONSULT-EE")) {
                        comp.record.SBQQ__SubscriptionTerm__c = psSkuBaseTerm;

                    }
                    if (qt.record.SBQQ__Type__c == "Renewal" && comp.record.SBQQ__SegmentKey__c == null) {
                        comp.record.SBQQ__StartDate__c = line.record.SBQQ__StartDate__c; // MCR: NOCACPQ-1452 Roll Start Date for Line items
                    }

                    if (comp.record.SBQQ__ProductFamily__c === 'Professional Services' && comp.record.Internal_SKU_Name__c != null && qt.record.SBQQ__Type__c == 'Amendment') {
                        comp.record.Process_Date__c = line.record.Process_Date__c;
                    }

                });
                isBundleSegmented = false;
            }
        });


        qt.record["InvalidSegment__c"] = !validSegment;

    }
    return Promise.resolve();
}

/**
 * NOVA-1052: MCR Changes
 * This method is called by the calculator before price rules are evaluated.
 * @param {QuoteModel} quoteModel JS representation of the quote being evaluated
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {Promise}
 */
export function onBeforePriceRules(quoteModel, quoteLines, conn) {
    var pricingDirective = quoteModel.record["Pricing_Directive__c"];
    var quoteStatus = quoteModel.record["SBQQ__Status__c"];
    if (!quoteHasXdrPotProducts(quoteModel, quoteLines) && quoteStatus !== CONSTANTS.QUOTE_STATUS.PENDING &&
        (pricingDirective == null || pricingDirective.indexOf(CONSTANTS.PRICING_DIRECTIVE.AFTER_PENDING) < 0)) {
        return Promise.resolve();
    }

    quoteLines.forEach(function(line) {
        if (line.record.IsWrapperSKU__c) {
            debug("====== line.record.ProductCode is:: " + line.record.SBQQ__ProductCode__c);
            debug("====== line.record.Serial_Number__c is:: " + line.record.Serial_Number__c);
            //NOVACPQ-1452 - Capture EndDate from Quote Header if co-terminated
            if (quoteModel.record.SBQQ__Type__c == "Renewal" && line.record.SBQQ__SegmentKey__c == null) {
                if (
                    quoteModel.record.SBQQ__EndDate__c !== null &&
                    (quoteModel.record.SBQQ__EndDate__c != quoteModel.record.Prior_End_Date__c || line.record.SBQQ__EndDate__c == null)
                ) {
                    line.record.SBQQ__EndDate__c = quoteModel.record.SBQQ__EndDate__c;
                }
            }
            //loop into the components for this bundle
            getAllComponents(line).forEach(function(comp) {
                if (line.record.Serial_Number__c != null && comp.record.Serial_Number__c == null) {
                    debug("====== Entered the if condition to update the SN");
                    comp.record.Serial_Number__c = line.record.Serial_Number__c;
                }
                //NOVACPQ-1127: Capture the End Date from Wrapper to child lines
                if (line.record.SBQQ__EndDate__c != null && comp.record.SBQQ__SegmentKey__c == null) {
                    comp.record.SBQQ__EndDate__c = line.record.SBQQ__EndDate__c;
                    console.log("====== comp.record.SBQQ__EndDate__c :: " + comp.record.SBQQ__EndDate__c);
                }
            });
        }
    });

    console.log("End onBeforePriceRules");
    return Promise.resolve();
}

/**
 * NOVA-1052: MCR Changes
 * This method is called by the calculator after price rules are evaluated.
 * @param {QuoteModel} quoteModel JS representation of the quote being evaluated
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {Promise}
 */
export function onAfterPriceRules(quoteModel, quoteLines, conn) {
    var pricingDirective = quoteModel.record["Pricing_Directive__c"];
    var quoteStatus = quoteModel.record["SBQQ__Status__c"];
    if (!quoteHasXdrPotProducts(quoteModel, quoteLines) && quoteStatus !== CONSTANTS.QUOTE_STATUS.PENDING &&
        (pricingDirective == null || pricingDirective.indexOf(CONSTANTS.PRICING_DIRECTIVE.AFTER_PENDING) < 0)) {
        return Promise.resolve();
    }

    //NOVACPQ-1127 - MCR: Logic - moved to this event to handle double calculate issue
    if (quoteModel.record.SBQQ__Type__c == "Renewal") {
        quoteLines.forEach(function(line) {
            //calculate the True Effective End Date and Term for each line
            var trueEndDate = calculateEndDate(quoteModel, line);
            var trueTerm = getEffectiveSubscriptionTerm(quoteModel, line);
            line.record.True_Effective_End_Date__c = toApexDate(trueEndDate);
            line.record.True_Effective_Term__c = trueTerm;
            if ((line.record.True_Effective_Term__c != null) & (line.record.True_Effective_Term__c > 0))
                line.record.SBQQ__SubscriptionTerm__c = line.record.True_Effective_Term__c;
        });
    }
    console.log("End onAfterPriceRules");
    return Promise.resolve();
}

export function onAfterCalculate(quoteModel, quoteLines, conn) {
    debug("****** onAfterCalculate: enter ");
    debug("****** onAfterCalculate: Constants .... " + CONSTANTS);
    var pricingDirective = quoteModel.record["Pricing_Directive__c"];
    var quoteStatus = quoteModel.record["SBQQ__Status__c"];
    if (!quoteHasXdrPotProducts(quoteModel, quoteLines) && quoteStatus !== CONSTANTS.QUOTE_STATUS.PENDING &&
        (pricingDirective == null || pricingDirective.indexOf(CONSTANTS.PRICING_DIRECTIVE.AFTER_PENDING) < 0)) {
        return Promise.resolve();
    }

    if (quoteLines != null && quoteModel != null) {
        var qt = quoteModel;
        var quoteType = qt.record["SBQQ__Type__c"];
        var quoteCreatedDate = Date.parse(qt.record["CreatedDate"] + "");
        var quoteCutoffDate = Date.parse(CONSTANTS.VOLUMEDISCOUNTCUTOFFDATE);
        var hasXDRBaseAutoAttach = false;
        var xdrAutoAttachSkus = [];
        var maxXDRBaseAutoAttachQuantityActual = 0;
		var maxXDRBaseAutoAttachQuantityExtended = 0;
        var hasTEBaseSku = false;
        var hasTEAddOnSku = false;

        //NOVACPQ-212 set disti Base or Program discount
        setDistiDiscounts(conn, quoteModel, quoteLines);

        //NOVACPQ-814,816 if To_Set Primary flag is set, that means this quote should be primary or unprimary during quote creation
        debug("****** onAfterCalculate: NOVACPQ-814,816 To_Set_Primary_Status__c " + qt.record["To_Set_Primary_Status__c"]);
        debug("****** onAfterCalculate: NOVACPQ-814,816 before SBQQ__Primary__c " + qt.record["SBQQ__Primary__c"]);
        if (qt.record["To_Set_Primary_Status__c"] == CONSTANTS.TO_SET_PRIMARY_STATUS.PRIMARY) {
            qt.record["SBQQ__Primary__c"] = true;
            qt.record["To_Set_Primary_Status__c"] = null;
            debug("****** onAfterCalculate: NOVACPQ-814,816 after SBQQ__Primary__c " + qt.record["SBQQ__Primary__c"]);
        } else if (qt.record["To_Set_Primary_Status__c"] == CONSTANTS.TO_SET_PRIMARY_STATUS.UNPRIMARY) {
            qt.record["SBQQ__Primary__c"] = false;
            //qt.record["To_Set_Primary_Status__c"] = null;  Postpone this till later in Quote afterUpdate as this might be cleared too fast before QLE Calculate button is hit
            debug("****** onAfterCalculate: NOVACPQ-814,816 after SBQQ__Primary__c " + qt.record["SBQQ__Primary__c"]);
        }

        debug("****** onAfterCalculate: quoteCreatedDate " + quoteCreatedDate + " quoteCutoffDate " + quoteCutoffDate);

        if (quoteCutoffDate <= quoteCreatedDate) {
            debug("****** onAfterCalculate: checking if asc is updated on quoe " + qt.record["Authorized_Support_Center__c"]);
            if (qt.record["Authorized_Support_Center__c"] == null || qt.record["Authorized_Support_Center__c"] == "") {
                debug("****** onAfterCalculate: asc null, initializing related values " + qt.record["Authorized_Support_Center__c"]);
                qt.record["ASC__c"] = null;
                qt.record["ASC_Name__c"] = null;
                debug("****** onAfterCalculate: asc null, updated related values " + qt.record["Authorized_Support_Center__c"]);
            }

            debug("****** onAfterCalculate: quote created after volume discount cut off " + quoteCreatedDate);

            //loop through all quote lines and for each quote line calculate NSP, handle logic for overriding net total
            quoteLines.forEach(function(ql) {
                var sku = getProductSKU(ql);

                if (CONSTANTS.TE_BASE_SKU.indexOf(sku) >= 0) {
                    hasTEBaseSku = true;
                }
                if (CONSTANTS.TE_ADD_ON_SKU_LIST.indexOf(sku) >= 0) {
                    hasTEAddOnSku = true;
                }
                if (CONSTANTS.XDR_BASE_SELECT_SKU_LIST_FOR_AUTO_ATTACH.indexOf(sku) >= 0 && ql.record["Is_Cloned__c"] == false) {
                    hasXDRBaseAutoAttach = true;
                    maxXDRBaseAutoAttachQuantityActual += ql.record["SBQQ__Quantity__c"];
                }
				if (CONSTANTS.XDR_BASE_SELECT_SKU_LIST_FOR_AUTO_ATTACH.indexOf(sku) >= 0 && ql.record["Is_Cloned__c"] == true) {
                    hasXDRBaseAutoAttach = true;
                    maxXDRBaseAutoAttachQuantityExtended += ql.record["SBQQ__Quantity__c"];
                }

                if (CONSTANTS.XDR_AUTO_ATTACH_SKU_LIST.indexOf(sku) >= 0) {
                    xdrAutoAttachSkus.push(sku);
                }

                //use this flag to check if Total discount should be less than Volume and Standardd Discount
                var approvalJustification = ql.record["Approval_Justification__c"];
                debug("****** onAfterCalculate: approvalJustification " + approvalJustification);

                var netTotalOverride = ql.record["Override_Net_Total__c"];
                debug("****** onAfterCalculate: prorateMultiplier step 1 " + sku + " prorate multiplier " + ql.record["SBQQ__ProrateMultiplier__c"]);

                //for perpetual license products handle renewal for support subscription
                if (quoteType == "Renewal" && CONSTANTS.PERPETUAL_POT.indexOf(sku) >= 0) {} else {

                    if (approvalJustification != null && approvalJustification.indexOf(CONSTANTS.IGNOREVOLUMEDISCOUNT) >= 0) {
                        debug("****** onAfterCalculate: discount override ignore volume discount " + approvalJustification);
                        calculateNSPDiscount(ql, sku);
                    } else {
                        var sLastEditedQuantity = ql.record["Last_Edited_Quantity__c"];
                        var sCurrentQuantity = ql.record["SBQQ__Quantity__c"];
                        //initialize partner price
                        ql.record["SBQQ__PartnerPrice__c"] = ql.record["SBQQ__RegularPrice__c"] / ql.record["SBQQ__ProrateMultiplier__c"];
                        initializeDiscountsAndPrices(ql);

                        if (
                            sku &&
                            sku.indexOf(CONSTANTS.REDLOCKSUPPORT) < 0 &&
                            sku.indexOf(CONSTANTS.TWISTLOCKSUPPORT) < 0
                        ) {
                            debug("****** onAfterCalculate: Processing SKU ************" + sku);

                            var additionalDisc = ql.record["SBQQ__AdditionalDiscountAmount__c"];
                            var volumeDisc = ql.record["Volume_Discount__c"];
                            if (isNaN(ql.record["Total_Discount__c"])) {
                                ql.record["Total_Discount__c"] = 0;
                            }
                            var totalDisc = ql.record["Total_Discount__c"];
                            //var nspDisc = ql.record["NSP_discount__c"];
                            var distiDisc = ql.record["Line_Default_Discount__c"];

                            if (quoteType == "Renewal") {
                                ql.record["SBQQ__NetPrice__c"] = ql.record["SBQQ__ProratedPrice__c"] * (1 - totalDisc / 100);
                            }
                            var sbqqNetPrice = ql.record["SBQQ__NetPrice__c"];
                            ql.record["SBQQ__NetTotal__c"] = sbqqNetPrice * ql.record["SBQQ__Quantity__c"];
                            var netTotal = ql.record["SBQQ__NetTotal__c"];
                            var listTotal = ql.record["SBQQ__ListTotal__c"];
                            var sbqqQuantity = ql.record["SBQQ__EffectiveQuantity__c"];
                            var regularTotal = ql.record["SBQQ__RegularPrice__c"] * sbqqQuantity; //ql.record["SBQQ__RegularTotal__c"];
                            //var discSchedule = ql.record["SBQQ__DiscountSchedule__c"];

                            //Discount fix for the default discounts for the migrated orders
                            if (additionalDisc != null) {
                                ql.record["SBQQ__AdditionalDiscountAmount__c"] = null;
                            }

                            debug("****** onAfterCalculate: ### SKU is " + sku + " - Last Edited Quantity " + sLastEditedQuantity + " - Current Quantity " + sCurrentQuantity);

                            //override discounts if net total override is listed on quote line
                            if (sLastEditedQuantity == sCurrentQuantity && netTotalOverride != null && netTotalOverride >= 0) {
                                debug("****** onAfterCalculate: ### Override Net total override " + netTotalOverride);
                                totalDisc = (1 - netTotalOverride / listTotal) * 100;
                                debug("****** onAfterCalculate: ### Override Net total totalDisc " + totalDisc + " distiDiscount " + distiDisc);

                                if (totalDisc < distiDisc) {
                                    debug("### Override Net total total discount reset to disti discount " + distiDisc);
                                    volumeDisc = 0;
                                    totalDisc = distiDisc;
                                    removeVolumeDiscountOnQuoteLine(ql);

                                }
                                ql.record["Total_Discount__c"] = totalDisc;
                            }

                            if (regularTotal == null) regularTotal = listTotal;

                            var netPrice = calculateNetPrice(ql);
                            debug(
                                "****** onAfterCalculate: *** Net Price based on total discount " + netPrice + "-sku" + sku + " listTotal " + listTotal + " totalDisc " + totalDisc
                            );

                            var pricePostVolumeDiscount = regularTotal;
                            if (isNaN(pricePostVolumeDiscount)) {
                                pricePostVolumeDiscount = 0;
                            }
                            debug("****** onAfterCalculate: List Price post volume discount " + pricePostVolumeDiscount);

                            var pricePostStandardDiscount = pricePostVolumeDiscount * (1 - distiDisc / 100);

                            //if the total discount needs to be updated based on tier selected
                            if (pricePostStandardDiscount <= netPrice || sLastEditedQuantity != sCurrentQuantity) {
                                debug("****** onAfterCalculate: ***Price getting updated " + pricePostStandardDiscount + "-sku" + sku);
                                if (sLastEditedQuantity == sCurrentQuantity && netTotalOverride != null && netTotalOverride >= 0) {
                                    debug("****** onAfterCalculate: net total overridde " + pricePostStandardDiscount + "-sku" + sku);
                                    volumeDisc = 0;
                                    pricePostVolumeDiscount = listTotal;
                                    pricePostStandardDiscount = listTotal * (1 - distiDisc / 100);
                                    removeVolumeDiscountOnQuoteLine(ql);
                                    debug("****** onAfterCalculate: net total pricePostStandardDiscount " + pricePostStandardDiscount + "-sku" + sku);
                                } else {
                                    debug("****** onAfterCalculate: set net price to price post standard discount " + pricePostStandardDiscount + "-sku" + sku);
                                    if (ql.record["Upgraded_To_Quote_Line__c"] == null) {
                                        netPrice = pricePostStandardDiscount;
                                    }
                                }

                                totalDisc = ((1 - netPrice / listTotal) * 100).toFixed(5);
                                if (isNaN(totalDisc)) {
                                    debug("****** onAfterCalculate: ***Price  total totalDisc NAN ### " + totalDisc);
                                    totalDisc = 0;
                                }
                                ql.record["Total_Discount__c"] = totalDisc;

                                debug("****** onAfterCalculate: ***Price getting updated total totalDisc with rounding ### " + totalDisc);
                            }

                            var sbqqAdditionalDisc = 0;
                            sbqqAdditionalDisc = (1 - netPrice / pricePostVolumeDiscount) * 100;

                            var nspDisc = 0;
                            nspDisc = (1 - netPrice / pricePostVolumeDiscount - distiDisc / 100) * 100;

                            if (netPrice == pricePostStandardDiscount) {
                                debug("****** onAfterCalculate: ***Price  nsp set to 0 discount " + nspDisc);
                                nspDisc = 0;
                            }
                            debug("****** onAfterCalculate: ***Price NSP discount " + nspDisc);
                            if (nspDisc < 0) nspDisc = 0;

                            ql.record["SBQQ__Discount__c"] = sbqqAdditionalDisc;

                            if (ql.record["Upgraded_To_Quote_Line__c"] == null) {
                                //Save a copy of the total discount value (this is used to move total incentives into NSP)
                                var totalDiscountCopy = (100 - (1 - (ql.record["Line_Default_Discount__c"] / 100)) * regularTotal / listTotal * 100);
                                var totalDiscount = Number(ql.record["Total_Discount__c"]);
                                if (Math.abs(totalDiscount - totalDiscountCopy) > 0.001) { // Using abs to compare floating numbers on discounts
                                    ql.record["NSP_discount__c"] = nspDisc + ql.record["Total_Incentives__c"];
                                    ql.record["Total_Incentives__c"] = 0;
                                } else {
                                    ql.record["NSP_discount__c"] = nspDisc;
                                }
                            }

                            ql.record["SBQQ__NetPrice__c"] = netPrice / sbqqQuantity;

                            debug(
                                "****** onAfterCalculate: *** -sku " +
                                sku +
                                " Price NSP discount  " +
                                nspDisc +
                                " Net price before " +
                                sbqqNetPrice +
                                " SBQQ Additional discount " +
                                sbqqAdditionalDisc +
                                " nspDisc " +
                                nspDisc +
                                " netPrice " +
                                netPrice
                            );
                            debug("****** onAfterCalculate: ***Price Net price to 2 decimal places " + (netPrice / sbqqQuantity).toFixed(2));
                        }

                        if (sLastEditedQuantity != sCurrentQuantity) {
                            ql.record["Last_Edited_Quantity__c"] = sCurrentQuantity;
                        }

                        if (isNaN(ql.record["NSP_discount__c"])) {
                            ql.record["NSP_discount__c"] = 0;
                        }
                        if (isNaN(ql.record["Total_Discount__c"])) {
                            ql.record["Total_Discount__c"] = 0;
                        }
                        if (isNaN(ql.record["Volume_Discount__c"])) {
                            ql.record["Volume_Discount__c"] = 0;
                        }
                        if (isNaN(ql.record["SBQQ__NetTotal__c"])) {
                            ql.record["SBQQ__NetTotal__c"] = 0;
                        }
                        if (isNaN(ql.record["SBQQ__NetPrice__c"])) {
                            ql.record["SBQQ__NetPrice__c"] = 0;
                        }

                        if (!isNaN(ql.record["Line_Default_Discount__c"]) && ql.record["Line_Default_Discount__c"] > ql.record["Total_Discount__c"]) {
                            ql.record["Total_Discount__c"] = ql.record["Line_Default_Discount__c"];
                        }

                        debug("****** onAfterCalculate: %%% NSP Calculated " + ql.record["NSP_discount__c"]);
                        if (ql.record["NSP_discount__c"] < 0.01) {
                            ql.record["NSP_discount__c"] = 0;
                            debug("****** onAfterCalculate: %%% NSP set to 0 " + ql.record["NSP_discount__c"]);
                        }
                    }
                }
            });

            //NOVACPQ-1240: MCR Changes for calculating Discount and NetTotal for Support using Override Net Total logic
            calculateOverrideNetTotal(quoteModel, quoteLines, conn);

            debug("****** onAfterCalculate: ***** calculating support Pricing");
            //calculate Support (POT) product pricing
            calculatePremiumSuccessPrice(quoteModel, quoteLines, conn);
            debug("****** onAfterCalculate: ***** setting approval required flags");
            var finalNetPrice = setBillingFrequencyBasedOnTotal(quoteModel, quoteLines, conn);

            setHostInsightsQtyAndDiscount(quoteModel, quoteLines);

            //set approval required checkbox to true for quote lines with NSP > 0
            setApprovalRequiredFlag(quoteModel, quoteLines, conn, hasTEBaseSku, hasTEAddOnSku, finalNetPrice);

            debug("****** onAfterCalculate: ***** processing completed");
			
			var maxXDRBaseAutoAttachQuantity = Math.max(maxXDRBaseAutoAttachQuantityActual, maxXDRBaseAutoAttachQuantityExtended);
            setAutoAttachErrorFlag(conn, qt, xdrAutoAttachSkus, hasXDRBaseAutoAttach, maxXDRBaseAutoAttachQuantity);

            resetUpgradedQuoteLine(quoteModel, quoteLines);

            setTermForProfesseionalServices(quoteModel, quoteLines);

            calculateCrypsisHours(quoteModel, quoteLines);


        }
    }
    return Promise.resolve();
}

function calculateCrypsisHours(quoteModel, quoteLines) {
    var crypsis_discount = 0;
    var cat_E_discuont = 0;

    quoteLines.forEach(function(line) {
        var ql = line;
        var sku = getProductSKU(line);

        if (CONSTANTS.EXTENDED_EXPERTISEPS_SKU.indexOf(sku) >= 0 || CONSTANTS.EXTENDED_EXPERTISEPS_CLEARANCE_SKU.indexOf(sku) >= 0) {
            overrideNetTotalOnAssets(line.record);
        }

        var family = ql.record["SBQQ__ProductFamily__c"];
        var NSP = ql.record["NSP_discount__c"];
        var discountCateg = ql.record["Discount_Category__c"];

        console.log('NSP >>', NSP);
        if (family != undefined && family == 'Crypsis') {
            // Crypsis Term Validations XDR-2373
            var defaultTerm = 12;
            var minCrypsisHours = 50;
            var minHours = 0;
            var listPrice = 0;
            var netPrice = 0;
            var subTerm = ql.record["SBQQ__SubscriptionTerm__c"];
            if (quoteModel.record.SBQQ__Type__c == 'Amendment') {
                subTerm = Math.round(getEffectiveSubscriptionTerm(quoteModel, line));
            }
            console.log('Crypsis subTerm >>', subTerm);
            if (subTerm > 12 && CONSTANTS.CRYPSIS_SKU_LIST.indexOf(ql.record["SBQQ__ProductCode__c"]) >= 0 && ql.record["SBQQ__ProductCode__c"].indexOf('PAN-CES-RET') >= 0) {
                minHours = ((subTerm - defaultTerm) * 5) + minCrypsisHours;
                listPrice = ql.record["SBQQ__ListPrice__c"];
                ql.record["SBQQ__ProrateMultiplier__c"] = 1;
                ql.record["SBQQ__ProratedListPrice__c"] = listPrice;
                ql.record["SBQQ__ProratedPrice__c"] = listPrice;

                ql.record["SBQQ__RegularPrice__c"] = listPrice;
                netPrice = listPrice * (1 - (ql.record["SBQQ__Discount__c"] / 100));
                ql.record["SBQQ__NetPrice__c"] = netPrice;
            }
            if (minHours > 0 && ql.record["SBQQ__Quantity__c"] < minHours) {
                ql.record["Crypsis_Min_Hours_Met__c"] = true;
            } else {
                ql.record["Crypsis_Min_Hours_Met__c"] = false;
            }

            if (NSP != undefined && NSP != 0 && NSP > crypsis_discount && discountCateg != undefined && discountCateg == 'E') {
                crypsis_discount = NSP;
            }
        } else if (NSP != undefined && NSP != 0 && discountCateg != undefined && discountCateg == 'E' && family != 'Crypsis' && NSP > cat_E_discuont) {
            cat_E_discuont = NSP;
        }
    });

    quoteModel.record["Max_Crypsis_Qt_Line_Avg_Disc__c"] = crypsis_discount;
    quoteModel.record["Max_Cat_E_Qt_Line_Avg_Disc_New__c"] = cat_E_discuont;

}

function setTermForProfesseionalServices(quoteModel, quoteLines) {
    quoteLines.forEach(function(lineWrapper) {
        var ql = lineWrapper.record;
        // This would set all Professional Service family sku's to 12 months.
        if (ql.SBQQ__ProductFamily__c === 'Professional Services' && ql.Internal_SKU_Name__c != null && ql.SKU_Sub_Type__c == 'Outcome Based') {
            if (quoteModel.record.SBQQ__Type__c == 'Amendment') {
                var ed = new Date(ql.Process_Date__c);
                ed.setUTCMonth(ed.getUTCMonth() + 12);
                ed.setUTCDate(ed.getUTCDate() - 1);
                ql.SBQQ__EndDate__c = toApexDate(ed);
                console.log('###Before Calculate :Professional Services>>:went into Loop:SBQQ__EndDate__c', ql.SBQQ__EndDate__c);
            } else {
                ql.SBQQ__SubscriptionTerm__c = 12;
                console.log('ql.professional Services', ql.SBQQ__SubscriptionTerm__c);
            }
        }
    });
}

function setBillingFrequencyBasedOnTotal(quoteModel, quoteLines, conn) {
    var finalNetPrice = 0;
    quoteLines.forEach(function(lineWrapper) {
        var ql = lineWrapper.record;
        if (ql.SBQQ__NetPrice__c != null && ql.SBQQ__NetPrice__c > 0 && ql.SBQQ__EffectiveQuantity__c != null && ql.SBQQ__EffectiveQuantity__c > 0) {
            finalNetPrice = finalNetPrice + ql.SBQQ__NetPrice__c * ql.SBQQ__EffectiveQuantity__c;
        }
    });

    return finalNetPrice;
}

function resetUpgradedQuoteLine(quoteModel, quoteLines) {
    var hasUpgradedQuoteLine = false;
    var qt = quoteModel;
    var minQuantity = 0;
    var upgradeDiscount = 0;
    var quoteLineMap = new Map();
    var upgradedSku = null;
    var endDate = null;
    var quantity = 0;
    var amdQuoteLnList = [];
    var extndQuoteLnList = [];
    var extndQuoteLn = [];
    let extendMap = new Map();

    quoteLines.forEach((lineWrapper) => {
        var line = lineWrapper.record;
        var sku = getProductSKU(lineWrapper);
        //EE SKU
        if (CONSTANTS.EXTENDED_EXPERTISEPS_MONTH_SKU.indexOf(sku) >= 0) {

            line.SBQQ__SubscriptionTerm__c = 1;
        }
        quoteLineMap.set(line.Upgraded_From_Quote_Line__c, line.Id);
        if (line.IsWrapperSKU__c == true && line.Is_Cloned__c == true) {
            line.Product_Code__c = line.SBQQ__ProductCode__c + ' -EXTENDED';
            extndQuoteLn.push(line.Id);
            extendMap.set(line.Id, line.SBQQ__Source__c);
        }
    });

    quoteLines.forEach((lineWrapper) => {
        var line = lineWrapper.record;

        if (extndQuoteLn.indexOf(line.SBQQ__RequiredBy__c) >= 0) {
            line.Is_Cloned__c = true;
        }
        if (line.SBQQ__EffectiveQuantity__c < 0 && line.Upgraded_To_Quote_Line__c == null) {
            line.Upgraded_To_Quote_Line__c = quoteLineMap.get(line.Id);
        }

        if (line.Upgraded_To_Quote_Line__c != null && line.SBQQ__EffectiveQuantity__c < 0) {
            hasUpgradedQuoteLine = true;
            minQuantity = line.SBQQ__Quantity__c;
            upgradeDiscount = line.Upgrade_Discount__c;
            debug("****** upgradeDiscount:" + upgradeDiscount);
            line.SBQQ__Discount__c = upgradeDiscount;
            line.Total_Discount__c = upgradeDiscount;
            line.NSP_discount__c = 0;

            if (line.Is_Extended_Line__c == true) {
                if (line.QLE_Lock_Fields__c != null && !line.QLE_Lock_Fields__c.includes('Process_Date__c')) {
                    line.QLE_Lock_Fields__c = line.QLE_Lock_Fields__c + ',Process_Date__c';
                }
            }
        }
        if (line.Upgraded_From_Quote_Line__c != null && line.SBQQ__UpgradedSubscription__c != null) {
            upgradedSku = line.SBQQ__Product__c;
            endDate = line.SBQQ__EndDate__c;
            quantity = line.SBQQ__Quantity__c;
        }
    });

    if (hasUpgradedQuoteLine == true && minQuantity != 0) {
        qt.record["Quote_Type__c"] = CONSTANTS.PARTIALUPGRADEQUOTETYPE;
    } else if (hasUpgradedQuoteLine == true) {
        qt.record["Quote_Type__c"] = CONSTANTS.UPGRADEQUOTETYPE;
    } else {
        qt.record["Quote_Type__c"] = null;
    }

    //If MidTerm Line Removed,Have to remove upgraded references
    quoteLines.forEach((lineWrapper) => {
        var line = lineWrapper.record;
        if (hasUpgradedQuoteLine == false) {
            line.Upgraded_To_Quote_Line__c = null;
        }
        if (upgradedSku != null && line.SBQQ__Product__c == upgradedSku && line.SBQQ__UpgradedSubscription__c == null && line.IsWrapperSKU__c == false) {
            var ed = new Date(endDate);
            if (ed != null) {
                ed.setUTCDate(ed.getUTCDate() + 1);
            }
            line.Process_Date__c = toApexDate(ed);
            line.SBQQ__Quantity__c = quantity;
            line.Is_Cloned__c = true;
        }

        if (line.SBQQ__SubscriptionPricing__c != null && line.IsWrapperSKU__c == false && line.SBQQ__RequiredBy__c != null) {
            if (line.Is_Cloned__c == true) {
                extndQuoteLnList.push(line.SBQQ__Product__c + extendMap.get(line.SBQQ__RequiredBy__c) + line.SBQQ__Quantity__c);
            } else {
                amdQuoteLnList.push(line.SBQQ__Product__c + line.SBQQ__RequiredBy__c + line.SBQQ__Quantity__c);
            }
        }

    });
    console.log('extndQuoteLnList>>', extndQuoteLnList);
    console.log('amdQuoteLnList>>', amdQuoteLnList);
    var isAmendExtendQuote = qt.record["Is_Term_Extended__c"];
    if (isAmendExtendQuote == true) {
        var haveDifferentProducts = false;
        if (extndQuoteLnList.length == amdQuoteLnList.length) {
            for (var i = 0; i < extndQuoteLnList.length; i++) {
                if (amdQuoteLnList.indexOf(extndQuoteLnList[i]) < 0) {
                    debug('checkForAmendExtendBundles: Entered:haveDifferentProducts' + haveDifferentProducts);
                    haveDifferentProducts = true;
                    break;
                }
            }
        } else {
            haveDifferentProducts = true;
        }


        if (haveDifferentProducts == true) {
            qt.record["Is_Number_Of_AE_Lines_Different__c"] = true;
        } else {
            qt.record["Is_Number_Of_AE_Lines_Different__c"] = false;
        }
    }


}

function setAutoAttachErrorFlag(conn, qt, xdrAutoAttachSkus, hasXDRBaseAutoAttach, maxXDRBaseAutoAttachQuantity) {
    debug("****** setAutoAttachErrorFlag:xdrAutoAttachSkus length" + xdrAutoAttachSkus.length);
    debug("****** setAutoAttachErrorFlag:hasXDRBaseAutoAttach" + hasXDRBaseAutoAttach);
    debug("****** setAutoAttachErrorFlag:maxXDRBaseAutoAttachQuantity" + maxXDRBaseAutoAttachQuantity);

    var validationRequired = false;
    var bronze = CONSTANTS.PS_EP_QS_BRONZE;
    var silver = CONSTANTS.PS_EP_QS_SILVER;
    var gold = CONSTANTS.PS_EP_QS_GOLD;
    debug("****** setAutoAttachErrorFlag:bronze" + bronze);
    debug("****** setAutoAttachErrorFlag:silver" + silver);
    debug("****** setAutoAttachErrorFlag:gold" + gold);

    //if(hasXDRBaseAutoAttach === true && xdrAutoAttachSkus.length === 0){
    //    validationRequired = true;
    //}else
    if (hasXDRBaseAutoAttach === true && xdrAutoAttachSkus.length > 0) {
        debug("****** setAutoAttachErrorFlag:xdrAutoAttachSkus.indexOf(bronze)" + xdrAutoAttachSkus.indexOf(bronze));
        debug("****** setAutoAttachErrorFlag:xdrAutoAttachSkus.indexOf(silver) " + xdrAutoAttachSkus.indexOf(silver));
        debug("****** setAutoAttachErrorFlag:xdrAutoAttachSkus.indexOf(gold)" + xdrAutoAttachSkus.indexOf(gold));

        if (
            maxXDRBaseAutoAttachQuantity > 0 &&
            maxXDRBaseAutoAttachQuantity <= 2500 &&
            xdrAutoAttachSkus.indexOf(bronze) === -1 &&
            xdrAutoAttachSkus.indexOf(silver) === -1 &&
            xdrAutoAttachSkus.indexOf(gold) === -1
        ) {
            validationRequired = true;
        } else if (
            maxXDRBaseAutoAttachQuantity > 2500 &&
            maxXDRBaseAutoAttachQuantity <= 20000 &&
            ((xdrAutoAttachSkus.indexOf(silver) === -1 && xdrAutoAttachSkus.indexOf(gold) === -1) || xdrAutoAttachSkus.indexOf(bronze) >= 0)
        ) {
            validationRequired = true;
        } else if (
            maxXDRBaseAutoAttachQuantity > 20000 &&
            (xdrAutoAttachSkus.indexOf(gold) === -1 || xdrAutoAttachSkus.indexOf(bronze) >= 0 || xdrAutoAttachSkus.indexOf(silver) >= 0)
        ) {
            validationRequired = true;
        }
    }
    debug("****** setAutoAttachErrorFlag:validationRequired" + validationRequired);
    qt.record["PS_Gold_Silver_Validation_Required__c"] = validationRequired;
}

//util function tto initialize discounts and prices on a quoteline
function initializeDiscountsAndPrices(ql) {
    if (ql.record["Volume_Discount__c"] == null || isNaN(ql.record["Volume_Discount__c"])) {
        ql.record["Volume_Discount__c"] = 0;
    }
    if (ql.record["Total_Discount__c"] == null || isNaN(ql.record["Total_Discount__c"])) {
        ql.record["Total_Discount__c"] = 0;
    }
    if (ql.record["Total_Discount__c"] < 0) ql.record["Total_Discount__c"] = 0;

    if (ql.record["NSP_discount__c"] == null || isNaN(ql.record["NSP_discount__c"])) {
        ql.record["NSP_discount__c"] = 0;
    }

    if (ql.record["NSP_discount__c"] < 0.01) {
        ql.record["NSP_discount__c"] = 0;
        debug("****** onAfterCalculate: %%% NSP set to 0 " + ql.record["NSP_discount__c"]);
    }

    if (ql.record["Line_Default_Discount__c"] == null || isNaN(ql.record["Line_Default_Discount__c"])) {
        ql.record["Line_Default_Discount__c"] = 0;
    }

    if (ql.record["SBQQ__NetTotal__c"] == null || isNaN(ql.record["SBQQ__NetTotal__c"])) {
        ql.record["SBQQ__NetTotal__c"] = 0;
    }

    if (ql.record["SBQQ__NetPrice__c"] == null || isNaN(ql.record["SBQQ__NetPrice__c"])) {
        ql.record["SBQQ__NetPrice__c"] = 0;
    }
}

//util function remove vocpqlume discount from a quote line
function removeVolumeDiscountOnQuoteLine(ql) {
    ql.record["SBQQ__DiscountTier__c"] = null;
    ql.record["Volume_Discount__c"] = 0;
    ql.record["SBQQ__RegularPrice__c"] = ql.record["SBQQ__ListPrice__c"] * ql.record["SBQQ__ProrateMultiplier__c"];
    ql.record["SBQQ__RegularTotal__c"] = ql.record["SBQQ__ListTotal__c"];
}

//util function to calculate Net Price
function calculateNetPrice(ql) {
    var totalDisc = ql.record["Total_Discount__c"];
    var listTotal = ql.record["SBQQ__ListTotal__c"];
    var netPrice = 0;
    netPrice = listTotal * (1 - totalDisc / 100);
    return netPrice;
}

//util function to calculate NSP discount by setting volume discount to 0
function calculateNSPDiscount(ql, sku) {
    ql.record["Volume_Discount__c"] = 0;
    if (ql.record["Line_Default_Discount__c"] == null || isNaN(ql.record["Line_Default_Discount__c"])) {
        ql.record["Line_Default_Discount__c"] = 0;
    }
    ql.record["SBQQ__Discount__c"] = ql.record["Total_Discount__c"];

    debug("****** calculateNSPDiscount: discount override ignore volume set total discount to  " + ql.record["Total_Discount__c"]);

    var totalDisc = ql.record["Total_Discount__c"];
    var sbqqQuantity = ql.record["SBQQ__EffectiveQuantity__c"];
    var netPrice = calculateNetPrice(ql);
    debug("****** calculateNSPDiscount: discount override Price pre reset totalDisc " + totalDisc + "-sku" + sku);
    debug("****** calculateNSPDiscount: discount override *Price Net Price based on total discount " + netPrice + "-sku" + sku);

    // Used for rolling up Total incentives into NSP
    var pricePostVolFromNSPFunction = ql.record["SBQQ__RegularPrice__c"] * ql.record["SBQQ__EffectiveQuantity__c"];
    var priceListTotalFromNSPFunction = ql.record["SBQQ__ListTotal__c"];
    var totalDiscountCopy = (100 - (1 - (ql.record["Line_Default_Discount__c"] / 100)) * pricePostVolFromNSPFunction / priceListTotalFromNSPFunction); //total discount
    var totalDiscount = Number(ql.record["Total_Discount__c"]);
    if (Math.abs(totalDiscount - totalDiscountCopy) > 0.001) {
        ql.record["NSP_discount__c"] = ql.record["Total_Discount__c"] - ql.record["Line_Default_Discount__c"] + ql.record["Total_Incentives__c"];
        ql.record["Total_Incentives__c"] = 0;
    } else {
        ql.record["NSP_discount__c"] = ql.record["Total_Discount__c"] - ql.record["Line_Default_Discount__c"];
    }

    debug("****** calculateNSPDiscount: discount override Price NSP discount updated " + ql.record["NSP_discount__c"] + "-sku" + sku);
    if (ql.record["NSP_discount__c"] < 0.01) {
        ql.record["NSP_discount__c"] = 0;
        debug("****** calculateNSPDiscount: %%% NSP set to 0 " + ql.record["NSP_discount__c"]);
    }

    ql.record["SBQQ__NetPrice__c"] = netPrice / sbqqQuantity;
    ql.record["SBQQ__CustomerPrice__c"] = netPrice / sbqqQuantity;

    debug("****** calculateNSPDiscount: discount override Price Net price to 2 decimal places " + (netPrice / sbqqQuantity).toFixed(2));
    debug("****** calculateNSPDiscount: discount override Price Updated Net Total " + netPrice + "-sku" + sku);
}

//util function to return SKU for the Quote Line. Checks Internal SKU
//and if it is null then returns the product code
function getProductSKU(ql) {
    var sku = ql.record["Internal_SKU_Name__c"];
    debug("****** getProductSKU: Checking for internal sku ************" + sku);
    if (sku == null) {
        sku = ql.record["SBQQ__ProductCode__c"];
        debug("****** getProductSKU: SKU is  ************" + sku);
    }
    return sku;
}

//running into character limits to do the same using formula fields and hence this function
//util function to set if approval is required for a quote line
function setApprovalRequiredFlag(quoteModel, quoteLines, conn, hasTEBaseSku, hasTEAddOnSku, finalNetPrice) {
    var qt = quoteModel;
    debug("****** setApprovalRequiredFlag: enter ");
    var isQuoteApprovalRequired = false;
    var quoteType = qt.record["SBQQ__Type__c"];
    var billingFrequency = qt.record["Billing_Frequency__c"];

    var quoteId = qt.record["Id"];
    var originalBaseLineCount = qt.record["TE_Original_Base_Line_Count__c"];
    var hasOriginalBaseSku = originalBaseLineCount !== null && originalBaseLineCount !== undefined && originalBaseLineCount > 0 ? true : false;
    // initializing the value to reset
    qt.record["TE_Add_On_Approval_Required__c"] = false;
    debug("****** setApprovalRequiredFlag: quoteId " + quoteId);

    quoteLines.forEach(function(line) {
        var ql = line;
        var approvalRequired = false;
        var discountReasonMandatory = false;
        debug("****** setApprovalRequiredFlag: ################################## ");
        debug(
            "****** setApprovalRequiredFlag: SBQQ__ProductCode__c " + ql.record["Internal_SKU_Name__c"] + " - SBQQ__EffectiveQuantity__c " + ql.record["SBQQ__EffectiveQuantity__c"]
        );

        if (ql.record["SBQQ__EffectiveQuantity__c"] !== null && ql.record["SBQQ__EffectiveQuantity__c"] > 0) {
            debug("****** setApprovalRequiredFlag: SBQQ__ProductCode__c processing " + ql.record["SBQQ__ProductCode__c"]);

            var discountPercent = ql.record["Discount_Percent_Subject_to_Approval__c"];
            var nspDiscountPercent = ql.record["NSP_discount__c"];
            console.log("****** setApprovalRequiredFlag: Discount Percentage %%%%%%%%% " + discountPercent);
            console.log("****** setApprovalRequiredFlag: NSP Discount Percentage %%%%%%%%% " + nspDiscountPercent);
            discountPercent = nspDiscountPercent;
            var approvalCategory = ql.record["Approval_Category__c"];
            var theatre = qt.record["Theatre__c"];

            console.log("****** setApprovalRequiredFlag: NSP Discount Percentage %%%%%%%%% " + nspDiscountPercent + " - Approval category " + approvalCategory);
            if (discountPercent > 5 && approvalCategory === "L") {
                approvalRequired = true;
                isQuoteApprovalRequired = true;
                discountReasonMandatory = true;
            } else if (
                discountPercent > 0 &&
                (approvalCategory === "C" || approvalCategory === "B" || approvalCategory === "0%" || approvalCategory === "E" || approvalCategory === "G" || approvalCategory === "D")
            ) {
                approvalRequired = true;
                isQuoteApprovalRequired = true;
                discountReasonMandatory = true;
            } else if (
                approvalCategory === "TE" &&
                hasTEAddOnSku === true &&
                hasTEBaseSku === false &&
                (quoteType === "Quote" || (quoteType !== "Quote" && quoteType !== null && hasOriginalBaseSku === false))
            ) {
                qt.record["TE_Add_On_Approval_Required__c"] = true;
                approvalRequired = true;
                isQuoteApprovalRequired = true;
                discountReasonMandatory = false;
            }
            if (billingFrequency != null && billingFrequency != "Upfront" && finalNetPrice > 500000 && qt.record["is_Sales_Rep__c"]) {
                isQuoteApprovalRequired = true;
                approvalRequired = true;
                discountReasonMandatory = false;
            }
            console.log("****** setApprovalRequiredFlag: setting discounat reason post proceessing %%%%%%%%% " + approvalRequired);
            ql.record["Is_Approval_Required__c"] = approvalRequired;
            ql.record["Is_Discount_Reason_Mandatory__c"] = discountReasonMandatory;
        }
    });
    console.log("****** setApprovalRequiredFlag: isQuoteApprovalRequired %%%%%%%%% " + isQuoteApprovalRequired);
    if (isQuoteApprovalRequired) {
        quoteModel.Discount_Reason_RollUp_Count__c = 1;
    } else {
        quoteModel.Discount_Reason_RollUp_Count__c = 0;
    }
    console.log("****** setApprovalRequiredFlag: quote model discount reason set %%%%%%%%% ");
}

//util function to check for duplicate lines
function checkForDuplicateLines(quoteModel, quoteLines) {
    debug("checkForDuplicateLines " + quoteLines);
    var foundProducts = new Set();
    var duplicatesFound = false;

    debug("checkForDuplicateLines: Beginning duplicate check on " + quoteLines.length + " quote lines");

    //Loop through Quote Lines
    quoteLines.forEach((lineWrapper) => {
        var line = lineWrapper.record;
        var productId = line.SBQQ__Product__c;

        debug("Line: " + line.SBQQ__Number__c + " - " + " Product ID: " + productId + " - Prohibit Multiple Lines: " + line.Prohibit_Multiple_Lines__c);

        //If the Product has been configured to prohibit multiple quote lines...
        if (line.Prohibit_Multiple_Lines__c == true) {
            //...check to see if the Product has already been encountered on any previous lines.
            if (foundProducts.has(productId)) {
                duplicatesFound = true; //Product encountered previously. Set the duplicates flag.
                debug("Dupe Check - Line " + line.SBQQ__Number__c + ": Product " + productId + " already encountered before, setting duplicate flag.");
            } else {
                foundProducts.add(productId); //Product encountered for the first time. Add to the set.
                debug("Dupe Check - Line " + line.SBQQ__Number__c + ": Product " + productId + " encountered for the first time.");
            }
        }
    });

    debug("Finished examining Quote Lines. Prohibited Duplicates Found: " + duplicatesFound);

    //If duplicates were found on products where this is disallowed, set a Quote-level field that a Product Validation Rule can catch.
    if (duplicatesFound) {
        quoteModel.record.Duplicate_Lines_Found__c = true;
    } else {
        quoteModel.record.Duplicate_Lines_Found__c = false;
    }

    debug(quoteModel);
}

//util function to set dates for products by group
function setProcessDate(quoteModel, quoteLines) {
    debug("setProcessDate: quote type" + quoteModel.record["SBQQ__Type__c"]);

    var quoteType = quoteModel.record["SBQQ__Type__c"];
    var isCloned = false;
    if (quoteType == "Amendment") {
        var isTermExtended = quoteModel.record["Is_Term_Extended__c"];
        //if the quote lines are cloned because of term extension then they need to be handledd separately for POT calculations
        if (isTermExtended) {
            isCloned = true;
        }
    }
    debug("setProcessDate: isCloned " + isCloned);

    updateProcessDateByGroup(quoteModel, quoteLines, false);
}

//util function to set dates for products by group
function updateProcessDateByGroup(quoteModel, quoteLines, isCloned) {
    var redLockProducts = CONSTANTS.REDLOCK;
    var twistLockProducts = CONSTANTS.TWISTLOCK;

    //process dates by product
    var redLockProcessDate = null;
    var redLockSupportProcessDate = null;
    var twisLockProcessDate = null;
    var twistLockSupportProcessDate = null;
    var cortexProcessDate = null;
    var xdrProcessDate = null;

    //subscription term by product
    var twistLockSubscriptionTerm = null;
    var redLockSubscriptionTerm = null;
    var demistoSubscriptionTerm = null;
    var xdrSubscriptionTerm = null;

    //end dates by product
    var twistLockEndDate = null;
    var redLockEndDate = null;
    var demistoEndDate = null;
    var xdrEndDate = null;

    var subscriptionTerm = null;
    var rlRegion = null;
    var tlRegion = null;
    var endDate = null;
    var currentProcessDate = null;
    var latestEndDate = null;
    var quoteType = quoteModel.record["SBQQ__Type__c"];
    var quoteStatus = quoteModel.record["SBQQ__Status__c"];
    var isRenewal = false;
    var segIndex = 0;

    var isUpgradeQuote = false;

    //fix for prorate multiplier not getting updated in case of a Renewal
    if (quoteType == "Renewal") {
        isRenewal = true;
    }
    //Loop through Quote Lines
    quoteLines.forEach((lineWrapper) => {
        var isDmstEntProd = false;
        var isXDRProduct = false;
        var isDemistoProduct = false;
        var isRedlockProduct = false;
        var isTwistlockProduct = false;
        var line = lineWrapper.record;

        var productId = line.SBQQ__ProductCode__c;
        var processDate = line.Process_Date__c;
        subscriptionTerm = line.SBQQ__SubscriptionTerm__c;
        var productGroup = line.Product_Group__c;
        debug(
            "****** onAfterCalculate: prorateMultiplier step 7 isRenewal " +
            isRenewal +
            " product id " +
            productId +
            " subscription term " +
            subscriptionTerm +
            " prorate multiplier " +
            line.SBQQ__ProrateMultiplier__c
        );
        debug("updateProcessDateByGroup: Beginning set process dates processing " + quoteLines.length + " quote lines");
        var lastEditedTerm = line.Last_Edited_Term__c;
        var contractEndDate = line.OriginalContractEndDate__c;
        endDate = line.SBQQ__EndDate__c;
        // NOVACPQ-1624
        debug("updateProcessDateByGroup quoteStatus " + quoteStatus);
        if (quoteStatus == CONSTANTS.QUOTE_STATUS.PENDING) {
            if (endDate < contractEndDate) {
                debug("updateProcessDateByGroup Updating endDate to " + contractEndDate);
                endDate = contractEndDate;
            }
        }
        // END NOVACPQ-1624
        var lastEditedEndDate = line.Last_Edited_End_Date__c;
        if (latestEndDate == null || endDate > latestEndDate) {
            latestEndDate = endDate;
        }

        var lineCloned = line.Is_Cloned__c;
        debug(
            "updateProcessDateByGroup: productId " +
            productId +
            " lineCloned " +
            lineCloned +
            " isCloned " +
            isCloned +
            " region " +
            line.Region__c +
            " total discount " +
            line.Total_Discount__c
        );

        var sku = line.Internal_SKU_Name__c;
        if (sku == null) {
            sku = productId;
        }
        /**
         * NOVA-1046: MCR changes
         * Moving Region__c attribute to Product Configuration and allowing users to select different region per bundle
         */
        //retrieve the RedLock or TwistLock Region value from the non-cloned quote lines.
        //cloned quote lines are created for handling the Amend & Extend scenario
        if (lineCloned == false) {
            if (redLockProducts.indexOf(sku) >= 0) {
                rlRegion = line.Region__c;
            }
            if (twistLockProducts.indexOf(sku) >= 0) {
                tlRegion = line.Region__c;
            }
        }

        if (line.Upgraded_To_Quote_Line__c != null) {
            isUpgradeQuote = true;
        }

        //do the calculations for cloned and non cloned items as separate groups
        if (lineCloned == isCloned) {
            //Move to seperate function later

            if (productGroup == CONSTANTS.XDRPG || CONSTANTS.NFRPG == productGroup) {
                isXDRProduct = true;
            }

            if (productGroup == CONSTANTS.DEMISTOPG) {
                isDemistoProduct = true;
            }

            if (productGroup == CONSTANTS.REDLOCKPG) {
                isRedlockProduct = true;
            }

            if (productGroup == CONSTANTS.TWISTLOCKPG) {
                isTwistlockProduct = true;
            }

            if (subscriptionTerm != null) {
                if (twistLockProducts.indexOf(productId) >= 0 || isRedlockProduct) {
                    twistLockSubscriptionTerm = getUpdatedTerm(subscriptionTerm, lastEditedTerm, twistLockSubscriptionTerm);
                }
                if (redLockProducts.indexOf(productId) >= 0 || isTwistlockProduct) {
                    redLockSubscriptionTerm = getUpdatedTerm(subscriptionTerm, lastEditedTerm, redLockSubscriptionTerm);
                }

                if (isDemistoProduct) {
                    demistoSubscriptionTerm = getUpdatedTerm(subscriptionTerm, lastEditedTerm, demistoSubscriptionTerm);
                }
                if (isXDRProduct) {
                    xdrSubscriptionTerm = getUpdatedTerm(subscriptionTerm, lastEditedTerm, xdrSubscriptionTerm);
                }
            }

            if (endDate != null) {
                if (twistLockProducts.indexOf(productId) >= 0 || isTwistlockProduct) {
                    twistLockEndDate = getUpdatedEndDate(endDate, lastEditedEndDate, twistLockEndDate);
                }
                if (redLockProducts.indexOf(productId) >= 0 || isRedlockProduct) {
                    redLockEndDate = getUpdatedEndDate(endDate, lastEditedEndDate, redLockEndDate);
                }

                if (isDemistoProduct) {
                    demistoEndDate = getUpdatedEndDate(endDate, lastEditedEndDate, demistoEndDate);
                    debug("updateProcessDateByGroup:  isCloned ****** " + isCloned + " - retrieved demistoEndDate " + demistoEndDate);
                }
                if (isXDRProduct) {
                    debug(
                        "updateProcessDateByGroup:  isCloned ****** " +
                        isCloned +
                        " - endDate " +
                        endDate +
                        " - lastEditedEndDate " +
                        lastEditedEndDate +
                        " - xdrEndDate " +
                        xdrEndDate
                    );
                    xdrEndDate = getUpdatedEndDate(endDate, lastEditedEndDate, xdrEndDate);
                    debug("updateProcessDateByGroup:  isCloned ****** " + isCloned + " - retrieved xdrEndDate " + xdrEndDate);
                }
            }

            if (processDate != null && processDate != "" && (currentProcessDate === null || currentProcessDate === "")) {
                currentProcessDate = processDate;
                line.SBQQ__StartDate__c = processDate;
                if (isDmstEntProd) {
                    cortexProcessDate = processDate;
                }
                if (productGroup == CONSTANTS.XDRPG) {
                    xdrProcessDate = processDate;
                }
            }


            if (redLockProducts.indexOf(productId) >= 0 || isRedlockProduct) {
                if (processDate != null && processDate != "") {
                    redLockProcessDate = processDate;
                }
            }

            if (twistLockProducts.indexOf(productId) >= 0 || isTwistlockProduct) {
                if (processDate != null && processDate != "") {
                    twisLockProcessDate = processDate;
                }
            }
        }
    });

    debug(
        "updateProcessDateByGroup:  rlRegion " +
        rlRegion +
        " isCloned " +
        isCloned +
        " - demistoEndDate " +
        demistoEndDate +
        " - xdrEndDate " +
        xdrEndDate +
        " - redLockEndDate ... " +
        redLockEndDate +
        " - twistLockEndDate " +
        twistLockEndDate +
        " subscription term ... " +
        subscriptionTerm +
        " twistlok subscription term ... " +
        twistLockSubscriptionTerm +
        " redLock subscription term ... " +
        redLockSubscriptionTerm +
        " - tl process date " +
        twisLockProcessDate +
        " - rl process date " +
        redLockProcessDate +
        " cortexProcessDate " +
        cortexProcessDate +
        " xdrProcessDate " +
        xdrProcessDate
    );
    quoteLines.forEach((lineWrapper) => {
        var line = lineWrapper.record;
        var productId = line.Internal_SKU_Name__c;
        var lineCloned = line.Is_Cloned__c;
        var productCode = line.SBQQ__ProductCode__c;

        //do the calculations for cloned and non cloned items as separate groups
        if (lineCloned == isCloned) {
            if (CONSTANTS.REDLOCKPG === line.Product_Group__c) {
                if (rlRegion != null && rlRegion != "") {
                    //line.Region__c = rlRegion; //Commented as part of NOVA-1046
                }
                if (redLockSubscriptionTerm) {
                    if (quoteType != "Renewal")
                        //NOVACPQ-1127: MCR- Condition added to skip for Renewals
                        line.SBQQ__SubscriptionTerm__c = redLockSubscriptionTerm;
                    line.Last_Edited_Term__c = redLockSubscriptionTerm;
                }
                if (redLockEndDate != null && line.SBQQ__SegmentKey__c == null) {
                    //if (quoteType != 'Amendment'){
                    if (quoteType != "Renewal")
                        //NOVACPQ-1127: MCR- Condition added to skip for Renewals
                        line.SBQQ__EndDate__c = redLockEndDate;
                    line.Last_Edited_End_Date__c = redLockEndDate;
                    //}
                }
            }
            if (CONSTANTS.TWISTLOCKPG === line.Product_Group__c) {
                if (tlRegion != null && tlRegion != "") {
                    //line.Region__c = tlRegion; //Commented as part of NOVA-1046
                }
                if (twistLockSubscriptionTerm) {
                    line.Last_Edited_Term__c = twistLockSubscriptionTerm;
                    if (quoteType != "Renewal")
                        //NOVACPQ-1127: MCR- Condition added to skip for Renewals
                        line.SBQQ__SubscriptionTerm__c = twistLockSubscriptionTerm;
                }
                if (twistLockEndDate != null && line.SBQQ__SegmentKey__c == null) {
                    //if (quoteType != 'Amendment'){
                    if (quoteType != "Renewal")
                        //NOVACPQ-1127: MCR- Condition added to skip for Renewals
                        line.SBQQ__EndDate__c = twistLockEndDate;
                    line.Last_Edited_End_Date__c = twistLockEndDate;
                    //}
                }
            }

            //Excluding PS SKUs from term changing as per NOVACPQ-1298
            if (CONSTANTS.DEMISTOPG === line.Product_Group__c) {
                if (productId.indexOf("PAN-DMST-PSV") < 0 &&
                    productCode != CONSTANTS.PAN_CONSULT_XSOAR_TIM_QS &&
                    productCode != CONSTANTS.PAN_CONSULT_XSOAR_ENT_QS &&
                    productCode != CONSTANTS.PAN_CONSULT_XSOAR_OPT &&
                    productCode != CONSTANTS.PAN_CONSULT_PRJM_DAY) {
                    if (demistoSubscriptionTerm) {
                        line.SBQQ__SubscriptionTerm__c = demistoSubscriptionTerm;
                        line.Last_Edited_Term__c = demistoSubscriptionTerm;
                    }
                    if (
                        (line.SBQQ__EndDate__c == null && !lineCloned && line.SBQQ__SegmentKey__c == null) ||
                        (line.SBQQ__EndDate__c != null && line.SBQQ__EndDate__c != demistoEndDate && !lineCloned && line.SBQQ__SegmentKey__c == null)
                    ) {
                        line.SBQQ__EndDate__c = latestEndDate;
                        line.Last_Edited_End_Date__c = latestEndDate;
                    } else {
                        if (demistoEndDate != null && line.SBQQ__SegmentKey__c == null) {
                            line.SBQQ__EndDate__c = demistoEndDate;
                            line.Last_Edited_End_Date__c = demistoEndDate;
                        }
                    }
                }
            }
            if (CONSTANTS.XDRPG === line.Product_Group__c) {
                if (xdrSubscriptionTerm) {
                    line.SBQQ__SubscriptionTerm__c = (line.SKU_Sub_Type__c == 'Outcome Based') ? 12 : xdrSubscriptionTerm;
                    line.Last_Edited_Term__c = (line.SKU_Sub_Type__c == 'Outcome Based') ? 12 : xdrSubscriptionTerm;
                }
                if (line.Upgraded_To_Quote_Line__c == null && line.Upgraded_From_Quote_Line__c == null) {
                    if (
                        (line.SBQQ__EndDate__c == null && !lineCloned && line.SBQQ__SegmentKey__c == null) ||
                        (line.SBQQ__EndDate__c != null && line.SBQQ__EndDate__c != xdrEndDate && !lineCloned && line.SBQQ__SegmentKey__c == null)
                    ) {
                        line.SBQQ__EndDate__c = latestEndDate;
                        line.Last_Edited_End_Date__c = latestEndDate;
                    } else {
                        if (xdrEndDate != null && line.SBQQ__SegmentKey__c == null) {
                            line.SBQQ__EndDate__c = xdrEndDate;
                            line.Last_Edited_End_Date__c = xdrEndDate;
                        }
                    }
                }
            }

            if (line.SBQQ__EndDate__c == null && line.SBQQ__SegmentKey__c == null && quoteType != "Renewal") {
                line.SBQQ__EndDate__c = latestEndDate;
            }
        }
    });

    debug("Finished examining process dates: " + redLockProcessDate + "-" + twisLockProcessDate);
    if ((twisLockProcessDate != null || redLockProcessDate != null || xdrProcessDate != null || cortexProcessDate != null) && isUpgradeQuote == false) {
        debug("Finished examining process dates: xdrProcessDate" + xdrProcessDate);
        quoteLines.forEach((lineWrapper) => {
            var line = lineWrapper.record;
            var productId = line.SBQQ__ProductCode__c;
            var lineCloned = line.Is_Cloned__c;

            //do the calculations for cloned and non cloned items as separate groups
            if (lineCloned == isCloned) {
                if (productId == CONSTANTS.REDLOCKSUPPORT) {
                    if (redLockProcessDate != null && !line.InactiveSegment__c) {
                        line.Process_Date__c = redLockProcessDate;
                    }
                }

                if (productId == CONSTANTS.TWISTLOCKSUPPORT) {
                    if (twisLockProcessDate != null && !line.InactiveSegment__c) {
                        line.Process_Date__c = twisLockProcessDate;
                    }
                }

                if (CONSTANTS.DEMISTOPG === line.Product_Group__c && !line.InactiveSegment__c) {
                    line.Process_Date__c = cortexProcessDate;
                }

                if ((CONSTANTS.XDRPG === line.Product_Group__c || CONSTANTS.NFRPG === line.Product_Group__c) && !line.InactiveSegment__c) {
                    line.Process_Date__c = xdrProcessDate;
                }
            }
        });
    }

    //set default process date on any lines with null values
    if (currentProcessDate != null && isUpgradeQuote == false) {
        quoteLines.forEach((lineWrapper) => {
            var line = lineWrapper.record;
            if (line.Process_Date__c == null && !line.InactiveSegment__c) {
                line.Process_Date__c = currentProcessDate;
            }
        });
    }


}



//util function to retrieve the subscription term for the product group
function getUpdatedTerm(subscriptionTerm, lastEditedTerm, productGroupTerm) {
    debug("getUpdatedTerm:  productGroupTerm " + productGroupTerm + " lastEditedTerm " + lastEditedTerm + " subscriptionTerm " + subscriptionTerm);
    if (productGroupTerm == null) {
        productGroupTerm = subscriptionTerm;
    } else {
        if (lastEditedTerm != null && lastEditedTerm > 0 && lastEditedTerm != subscriptionTerm) {
            productGroupTerm = subscriptionTerm;
        } else {
            if (lastEditedTerm == null && productGroupTerm == null) {
                productGroupTerm = subscriptionTerm;
            } else {
                if (lastEditedTerm == null && productGroupTerm != subscriptionTerm && productGroupTerm < subscriptionTerm) {
                    productGroupTerm = subscriptionTerm;
                }
            }
        }
    }
    debug("getUpdatedTerm:  return " + productGroupTerm);

    return productGroupTerm;
}

//util function to retrieve the end date for the product group
function getUpdatedEndDate(endDate, lastEditedEndDate, productGroupEndDate) {
    debug("getUpdatedEndDate:  productGroupEndDate " + productGroupEndDate + " lastEditedEndDate " + lastEditedEndDate + " endDate " + endDate);
    if (productGroupEndDate == null) {
        productGroupEndDate = endDate;
    } else {
        if (lastEditedEndDate != null && lastEditedEndDate > 0 && lastEditedEndDate != endDate) {
            productGroupEndDate = endDate;
        } else {
            if (lastEditedEndDate == null && productGroupEndDate == null) {
                productGroupEndDate = endDate;
            } else {
                if (lastEditedEndDate == null && productGroupEndDate != endDate && productGroupEndDate < endDate) {
                    productGroupEndDate = endDate;
                }
            }
        }
    }
    debug("getUpdatedEndDate:  return " + productGroupEndDate);

    return productGroupEndDate;
}

//util function for calculating premium success pricce
function calculatePremiumSuccessPrice(quoteModel, quoteLines, conn) {
    var quoteType = quoteModel.record["SBQQ__Type__c"];
    var isCloned = false;
    if (quoteType == "Amendment") {
        var isTermExtended = quoteModel.record["Is_Term_Extended__c"];
        //if the quote lines are cloned because of term extension then they need to be handledd separately for POT calculations
        if (isTermExtended) {
            isCloned = true;
        }
    }
    debug("calculatePremiumSuccessPrice: quoteType " + quoteType);
    debug("calculatePremiumSuccessPrice: isCloned " + isCloned);


    getPremiumSuccessProducts(quoteModel, quoteLines);
    if (quoteType == "Amendment") {
        calculateCreditAmountForPOTProducts(quoteModel, quoteLines);
    }


}


//util function to retrieve discount value based on a tier
function getDiscountTierValue(conn, discountTierId, ql) {
    return conn.query("SELECT SBQQ__Discount__c FROM SBQQ__DiscountTier__c WHERE Id = '" + discountTierId + "'").then(function(results) {
        if (results.totalSize) {
            results.records.forEach(function(record) {
                var discountPercentage = record.SBQQ__Discount__c + 5;

                debug("#####getDiscountTierValue: discountPercentage: updated " + discountPercentage);
                ql.Volume_Discount__c = discountPercentage;
            });
        }
    });
}

//util function to set ASC__c value from the lookup filter for Authorized_Support_Center__c
function setASCValue(conn, qt, lookupId) {
    debug("#####setASCValue: lookupId " + lookupId);
    return conn.query("SELECT ASC__c, ASC__r.Name FROM ASC_Quote_LookUp__c WHERE Id = '" + lookupId + "'").then(function(results) {
        debug("#####setASCValue: results.totalSize " + results.totalSize);
        if (results.totalSize) {
            results.records.forEach(function(record) {
                var asc = record.ASC__c;
                debug("#####setASCValue: asc retrieved " + asc);
                var ascName = record.ASC__r.Name;

                debug("#####setASCValue: asc " + asc + " name " + ascName);
                qt.record["ASC__c"] = asc;
                qt.record["ASC_Name__c"] = ascName;
            });
        }
    });
}

//util function to check if price overriding is enabled for current user
function isPriceOverrideEnabled(conn, currentUserId, ql) {
    debug("#####isPriceOverrideEnabled: checking for user " + currentUserId);
    return conn
        .query(
            "Select Id, UserOrGroupId,GroupId, Group.type From GroupMember where  Group.Name = '" + CONSTANTS.PRICEOVERRIDEGROUP + "' and UserOrGroupId = '" + currentUserId + "'"
        )
        .then(function(results) {
            if (results.totalSize) {
                debug("#####isPriceOverrideEnabled: user found in overriddee group " + currentUserId);
                ql.Is_Price_Override_Enabled__c = true;
                debug("#####isPriceOverrideEnabled: override set to true " + ql.Is_Price_Override_Enabled__c);
            } else {
                debug("#####isPriceOverrideEnabled: user not found in overriddee group " + currentUserId);
                ql.Is_Price_Override_Enabled__c = false;
                debug("#####isPriceOverrideEnabled: override set to FALSE " + ql.Is_Price_Override_Enabled__c);
            }
        });
}



function debug(args) {
    if (CONSTANTS.DEBUG) {
        console.log(args);
    }
}

//NOVACPQ-212 Set Disti discounts on each line Line_Default_Discount__c
function setDistiDiscounts(conn, qt, quoteLines) {
    if (
        qt.record["SBQQ__Status__c"] == CONSTANTS.QUOTE_STATUS.PENDING &&
        (qt.record["SBQQ__Type__c"] != "Renewal" || qt.record["isDisti_Or_IsReseller_Quote__c"] == CONSTANTS.IS_DISTI_OR_RESELLER_QUOTE.IS_DISTI_QUOTE) &&
        qt.record["Is_MarketPlace_Quote__c"] == false
    ) {
        debug("#####setDistiDiscounts  inside ");
        if (qt.record["Discount_Type__c"] == CONSTANTS.DISCOUNT_TYPE.BASE_DISCOUNT) {
            // Overwrite Price Rules on Disti Standard Discount
            var theatre = qt.record["Quote_Theater__c"] == CONSTANTS.THEATRE.NORTH_AMERICA ? "NAM" : "INTL";
            quoteLines.forEach(function(ql) {
                if (qt.record["SBQQ__Type__c"] == "Renewal") {
                    if (CONSTANTS.BASE_DISCOUNT_DATA[theatre][ql.record["Discount_Category__c"]] != null) {
                        ql.record["Line_Default_Discount__c"] = CONSTANTS.BASE_DISCOUNT_DATA[theatre][ql.record["Discount_Category__c"]];
                        ql.record["Nextwave_Standard_Discount__c"] = CONSTANTS.BASE_DISCOUNT_DATA[theatre][ql.record["Discount_Category__c"]];
                    }
                }
                if (ql.record["SBQQ__ProductCode__c"].indexOf("LAB") >= 0) {
                    ql.record["Line_Default_Discount__c"] = CONSTANTS.BASE_DISCOUNT_DATA[theatre]["LAB"];
                }
                if (ql.record["SBQQ__ProductCode__c"].indexOf("NFR") >= 0) {
                    ql.record["Line_Default_Discount__c"] = CONSTANTS.BASE_DISCOUNT_DATA[theatre]["NFR"];
                }
            });
        }
        // If Discount Type was changed, reset total discount to clear out NSP
        if (
            qt.record["Discount_Type__c"] != qt.record["Last_Edited_Discount_Type__c"] &&
            (qt.record["Discount_Type__c"] == CONSTANTS.DISCOUNT_TYPE.BASE_DISCOUNT || qt.record["Last_Edited_Discount_Type__c"] == CONSTANTS.DISCOUNT_TYPE.BASE_DISCOUNT)
        ) {
            quoteLines.forEach(function(ql) {
                ql.record["Total_Discount__c"] = 0;
            });
        }
        // Remember Discount Type for checking next time
        qt.record["Last_Edited_Discount_Type__c"] = qt.record["Discount_Type__c"];
    }
}

/**
 * NOVA-1052: MCR Changes
 * This method is used to capture all the components within a bundle.
 * Call this method to loop into a product which has components of its own.
 **/
function getAllComponents(line) {
    var results = line.components;
    results.forEach(function(comp) {
        results = results.concat(getAllComponents(comp));
    });
    return results;
}

/**
 * NOVACPQ-1127: MCR Changes
 * This method is used to calculate the End Date
 **/
function calculateEndDate(quote, line) {
    console.log("====== Method:: calculateEndDate");
    console.log("====== onAfterCalculate ==> Method:: calculateEndDate ==> Effective End Date:: " + line.record.SBQQ__EffectiveEndDate__c);
    console.log("====== onAfterCalculate ==> Method:: calculateEndDate ==> Effective Start Date:: " + line.record.SBQQ__EffectiveStartDate__c);
    var sd = new Date(line.record["SBQQ__EffectiveStartDate__c"]);
    var ed = new Date(line.record["SBQQ__EffectiveEndDate__c"]);
    if (sd != null && ed != null) {
        ed = sd;
        ed.setUTCMonth(ed.getUTCMonth() + getEffectiveSubscriptionTerm(quote, line));
        ed.setUTCDate(ed.getUTCDate() - 1);
    }
    console.log("====== Method:: calculateEndDate ==> EndDate:: " + ed);
    return ed;
}
/**
 * NOVACPQ-1127: MCR Changes
 * This method is used to calculate the SubscriptionTerm
 **/
function getEffectiveSubscriptionTerm(quote, line) {
    console.log("====== Method:: getEffectiveSubscriptionTerm");
    //capture the start date on the line item
    if (line.record["SBQQ__StartDate__c"] != null) {
        var sd = new Date(line.record["SBQQ__StartDate__c"]);
    } else if (line.record["SBQQ__EffectiveStartDate__c"] != null) {
        var sd = new Date(line.record["SBQQ__EffectiveStartDate__c"]);
    }
    //capture the end date on the line item
    if (line.record["SBQQ__EndDate__c"] != null) {
        var ed = new Date(line.record["SBQQ__EndDate__c"]);
    } else if (line.record["SBQQ__EffectiveEndDate__c"] != null) {
        var ed = new Date(line.record["SBQQ__EffectiveEndDate__c"]);
    }
    if (sd != null && ed != null) {
        ed.setUTCDate(ed.getUTCDate() + 1);
        return monthsBetween(sd, ed);
    } else if (line.SubscriptionTerm__c != null) {
        return line.SubscriptionTerm__c;
    } else if (quote.SubscriptionTerm__c != null) {
        return quote.SubscriptionTerm__c;
    } else {
        return line.DefaultSubscriptionTerm__c;
    }
}

/**
 * NOVACPQ-1127: MCR Changes
 * Takes a JS Date object and turns it into a string of the type 'YYYY-MM-DD', which is what Apex is expecting.
 * @param {Date} date The date to be stringified
 * @returns {string}
 */
function toApexDate( /*Date*/ date) {
    if (date == null) {
        return null;
    }
    // Get the ISO formatted date string.
    // This will be formatted: YYYY-MM-DDTHH:mm:ss.sssZ
    var dateIso = date.toISOString();

    // Replace everything after the T with an empty string
    return dateIso.replace(new RegExp("[Tt].*"), "");
}

/**
 * NOVACPQ-1127: MCR Changes
 * This method is used to calculate the months between two dates
 **/
function monthsBetween( /*Date*/ startDate, /*Date*/ endDate) {
    if (startDate != null && endDate != null) {
        // If the start date is actually after the end date, reverse the arguments and multiply the result by -1
        if (startDate > endDate) {
            return -1 * this.monthsBetween(endDate, startDate);
        }
        var result = 0;
        // Add the difference in years * 12
        result += (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12;
        // Add the difference in months. Note: If startDate was later in the year than endDate, this value will be
        // subtracted.
        result += endDate.getUTCMonth() - startDate.getUTCMonth();
        return result;
    }
    return 0;
}
/**
 * NOVACPQ-1240: MCR Changes
 * This method is used to calculate Discount and NetTotal of Support line based on Override_Net_Total__c
 **/
function calculateOverrideNetTotal(quoteModel, quoteLines, conn) {
    quoteLines.forEach(function(line) {
        if (line.record.IsWrapperSKU__c) {
            //loop into the components for this bundle
            getAllComponents(line).forEach(function(comp) {
                var sku = getProductSKU(comp);
                console.log('======== Current SKU is:: ' + sku);
                var ql = comp.record;
                if (CONSTANTS.TWISTLOCKSUPPORT.indexOf(sku) >= 0 || CONSTANTS.REDLOCKSUPPORT.indexOf(sku) >= 0) {
                    console.log('======== Support SKU is:: ' + sku);
                    console.log('======== ListTotal is:: ' + ql.SBQQ__ListTotal__c);
                    console.log('======== SBQQ__ProrateMultiplier__c is:: ' + ql.SBQQ__ProrateMultiplier__c);
                    console.log('======== Regular Price is:: ' + ql.SBQQ__RegularPrice__c);
                    console.log('======== Regular Total is:: ' + ql.SBQQ__RegularTotal__c);


                    var netTotalOverride = ql.Override_Net_Total__c;
                    debug('*****setPOTPrice: sku ' + sku + ' netTotalOverride ' + netTotalOverride + ' ql.Total_Discount__c ' + ql.Total_Discount__c);
                    if ((netTotalOverride != null) && (netTotalOverride >= 0)) {
                        debug('*****setPOTPrice: updating total discount based on overridde for sku ' + sku + ' netTotalOverride ' + netTotalOverride);
                        ql.Total_Discount__c = (1 - (netTotalOverride / ql.SBQQ__RegularTotal__c)) * 100;
                        debug('*****setPOTPrice: updated total discount with overridde  for sku ' + sku + ' Total discount ' + ql.Total_Discount__c);
                    }
                    if (ql.Total_Discount__c >= 0) {
                        console.log('======== ql.Total_Discount__c:: ' + ql.Total_Discount__c);
                        var nspDiscount = ql.Total_Discount__c - ql.Line_Default_Discount__c;
                        if (nspDiscount < 0.01) {
                            nspDiscount = 0;
                            ql.Total_Discount__c = ql.Line_Default_Discount__c;
                        }
                        ql.SBQQ__Discount__c = ql.Total_Discount__c;
                        ql.NSP_discount__c = nspDiscount;
                        var netPrice = (ql.SBQQ__RegularTotal__c * (100 - ql.Total_Discount__c)) / 100;
                        ql.SBQQ__NetPrice__c = netPrice;
                        ql.SBQQ__CustomerPrice__c = ql.SBQQ__RegularPrice__c;
                        ql.SBQQ__PartnerPrice__c = ql.SBQQ__RegularPrice__c;
                    }
                }
            });
        }
    });
}

//Get Host Insight Products
function getHostInsightProducts(quoteLines) {
    var hostProductList = [];
    quoteLines.forEach(lw => {
        var ql = lw.record;
        var sku = ql.Internal_SKU_Name__c;
        if (sku != null && CONSTANTS.HOSTINSIGHTS.indexOf(ql.Internal_SKU_Name__c) >= 0) {
            var hostMap = {};
            hostMap['productId'] = ql.SBQQ__Product__c;
            hostMap['endDate'] = ql.SBQQ__EndDate__c;
            hostMap['requiredBy'] = ql.SBQQ__RequiredBy__c;
            hostProductList.push(hostMap);
        }
    });
    debug('getHostInsightProducts: hostProductList.length' + hostProductList.length);
    return hostProductList;
}


//function to set quantity and discount for host insights
function setHostInsightsQtyAndDiscount(quoteModel, quoteLines) {
    debug("****** setHostInsightsQtyAndDiscount:");
    var qt = quoteModel;
    var quoteType = qt.record["SBQQ__Type__c"];
    var isLegacyHIContract = null;
    var hostQuantityList = [];

    if (quoteType == CONSTANTS.AMEND) {
        isLegacyHIContract = qt.record["Contract_Excluded_From__c"];
    }
    debug("****** setHostInsightsQtyAndDiscount:quantity:isLegacyHIContract" + isLegacyHIContract);

    var hostProductList = getHostInsightProducts(quoteLines);


    if (hostProductList.length > 0) {
        for (var i = 0; i < hostProductList.length; i++) {
            var hostMap = hostProductList[i];
            var hostendDate = hostMap.endDate;
            var hostrequiredBy = hostMap.requiredBy;
            var quantity = 0;
            var nocdlQuantity = 0;
            quoteLines.forEach(lineWrapper => {
                var line = lineWrapper.record;
                var sku = line.Internal_SKU_Name__c;
                debug("****** setHostInsightsQtyAndDiscount:quantity:sku" + sku);

                if (sku != null && sku.indexOf("PAN-XDR-ADV-EP") >= 0 && line.SBQQ__EndDate__c == hostendDate && line.SBQQ__RequiredBy__c == hostrequiredBy) {
                    quantity += line.SBQQ__Quantity__c;
                }

                if (sku != null && sku.indexOf("PAN-XDR-ADV-NOCDL") >= 0 && line.SBQQ__EndDate__c == hostendDate && line.SBQQ__RequiredBy__c == hostrequiredBy) {
                    nocdlQuantity = line.SBQQ__Quantity__c * 200;
                    quantity += nocdlQuantity;
                }
            });
            var hostQuantityMap = {};
            hostQuantityMap['hostQuantity'] = quantity;
            hostQuantityMap['endDate'] = hostendDate;
            hostQuantityMap['requiredBy'] = hostrequiredBy;
            hostQuantityList.push(hostQuantityMap);
        }

        debug("****** setHostInsightsQtyAndDiscount:quantity:q" + hostQuantityList.length);
        for (var l = 0; l < hostQuantityList.length; l++) {
            var htMap = hostQuantityList[l];
            var htendDate = htMap.endDate;
            var htrequiredBy = htMap.requiredBy;
            var htQuantity = htMap.hostQuantity;
            quoteLines.forEach(lWrapper => {
                var ql = lWrapper.record;
                if (CONSTANTS.HOSTINSIGHTS.indexOf(ql.Internal_SKU_Name__c) >= 0 && htendDate == ql.SBQQ__EndDate__c && htrequiredBy == ql.SBQQ__RequiredBy__c) {
                    ql.SBQQ__Quantity__c = htQuantity;
                    if (quoteType == CONSTANTS.AMEND && isLegacyHIContract != null && isLegacyHIContract.indexOf(CONSTANTS.HSTCONTRACT) >= 0 && ql.Is_Cloned__c == false) {
                        ql.Total_Discount__c = 100;
                    }
                }
            });
        }
    }
};

//Premium Success Calculations
function getPremiumSuccessProducts(quoteModel, quoteLines) {


    quoteLines.forEach(function(line) {
        if (line.record.IsWrapperSKU__c) {
            var bundleQuoteLines = [];
            var potProductList = [];
            //loop into the components for this bundle
            getAllComponents(line).forEach(function(comp) {
                bundleQuoteLines.push(comp.record);
                if (comp.record.SBQQ__SubscriptionPercent__c != null && comp.record.SBQQ__SubscriptionPercent__c > 0 && comp.record.POT_Products__c != null) {

                    var potMap = {};
                    potMap['productId'] = comp.record.SBQQ__Product__c;
                    potMap['products'] = comp.record.POT_Products__c;
                    potMap['potPercent'] = comp.record.SBQQ__SubscriptionPercent__c;
                    potMap['endDate'] = comp.record.SBQQ__EndDate__c;
                    potMap['priorQuantity'] = comp.record.SBQQ__PriorQuantity__c;
                    potMap['requiredBy'] = comp.record.SBQQ__RequiredBy__c;
                    potMap['upgradedSubscription'] = comp.record.SBQQ__UpgradedSubscription__c;
                    potMap['isCloned'] = comp.record.Is_Cloned__c;
                    potProductList.push(potMap);
                }
            });
            debug("****** performPremiumSuccessCalculations:quantity:bundleQuoteLines" + bundleQuoteLines.length);
            debug("****** performPremiumSuccessCalculations:quantity:bundleQuoteLines" + bundleQuoteLines);
            performPremiumSuccessCalculations(quoteModel, bundleQuoteLines, potProductList);
        }
    });
}


function performPremiumSuccessCalculations(quoteModel, quoteLines, potProductsList) {
    var potList = [];
    // var potProductsList = getPremiumSuccessProducts(quoteLines);
    debug('performPremiuSuccessCalculations: potProductsList.length' + potProductsList.length);
    var potPrice = 0;
    var qt = quoteModel;
    var isTermExtended = qt.record["Is_Term_Extended__c"];

    if (potProductsList.length > 0) {
        for (var i = 0; i < potProductsList.length; i++) {
            var potMap = potProductsList[i];
            var potproductId = potMap.productId;
            var products = potMap.products;
            var potPercent = potMap.potPercent;
            var endDate = potMap.endDate;
            var requiredBy = potMap.requiredBy;
            var priorQuantity = potMap.priorQuantity;
            var potProdLst = products.split(',');
            var potUpgradedSub = potMap.upgradedSubscription;
            var potIsCloned = potMap.isCloned;
            debug('performPremiuSuccessCalculations: priorQuantity' + priorQuantity);

            for (var j = 0; j < potProdLst.length; j++) {
                debug('performPremiuSuccessCalculations pot within pot:');
                quoteLines.forEach(lw => {
                    var line = lw;
                    console.log('performPremiuSuccessCalculations pot within pot:lwrecord', lw.record);
                    debug('performPremiuSuccessCalculations pot within pot:' + line.SBQQ__ProductCode__c);
                    if (line.SBQQ__ProductCode__c == potProdLst[j] && line.SBQQ__SubscriptionPercent__c > 0 && line.SBQQ__EndDate__c == endDate && requiredBy == line.SBQQ__RequiredBy__c) {
                        debug('performPremiuSuccessCalculations: SBQQ__EndDate__c' + endDate);
                        debug('performPremiuSuccessCalculations pot within pot:productcode' + line.SBQQ__ProductCode__c);
                        var potPrds = line.POT_Products__c;
                        debug('performPremiuSuccessCalculations pot within pot:POT_Products__c' + line.POT_Products__c);
                        var potPrdsLst = potPrds.split(',');
                        var potwithinPotPrice = 0;
                        debug('performPremiuSuccessCalculations pot within pot: potPrdsLst' + potPrdsLst.length);

                        for (var k = 0; k < potPrdsLst.length; k++) {
                            quoteLines.forEach(lwrapper => {
                                var qln = lwrapper;
                                if (qln.SBQQ__ProductCode__c == potPrdsLst[k] && qln.SBQQ__EndDate__c == endDate && qln.SBQQ__Quantity__c > 0 && requiredBy == qln.SBQQ__RequiredBy__c) {

                                    debug('performPremiuSuccessCalculations pot within pot: potPrdsLst## potwithinPotPrice' + potwithinPotPrice);

                                    var pVolumeDisc = 0;
                                    if (qln.SBQQ__DiscountTier__c != null) {
                                        pVolumeDisc = (1 - (qln.SBQQ__RegularPrice__c / (qln.SBQQ__ListPrice__c * qln.SBQQ__ProrateMultiplier__c))) * 100;
                                    }

                                    var proratedUtPrice = qln.SBQQ__ListPrice__c * qln.SBQQ__ProrateMultiplier__c * (1 - (pVolumeDisc / 100));

                                    if (priorQuantity != null && qln.SBQQ__EffectiveQuantity__c > 0) {
                                        proratedUtPrice = proratedUtPrice * qln.SBQQ__EffectiveQuantity__c;
                                    } else if (priorQuantity != null && qln.SBQQ__EffectiveQuantity__c < 0) { //For Midterm Partial Upgrade Calcualtions
                                        proratedUtPrice = 0;
                                    } else if (priorQuantity == null && qln.SBQQ__EffectiveQuantity__c < 0) {
                                        proratedUtPrice = proratedUtPrice * qln.SBQQ__EffectiveQuantity__c * -1;
                                    } else if (priorQuantity == null) {
                                        proratedUtPrice = proratedUtPrice * qln.SBQQ__Quantity__c;
                                    } else {
                                        proratedUtPrice = 0;
                                    }

                                    potwithinPotPrice += (proratedUtPrice * (line.SBQQ__SubscriptionPercent__c / 100));

                                    debug('performPremiuSuccessCalculations pot within pot: potPrdsLst##%% potwithinPotPrice' + potwithinPotPrice);

                                }
                            });
                        }
                        potwithinPotPrice = potwithinPotPrice * (potPercent / 100);

                        debug('performPremiuSuccessCalculations pot within pot: potwithinPotPrice#### potwithinPotPrice' + potwithinPotPrice);

                        potPrice += potwithinPotPrice;

                    }
                    //To Support If POT is added in an amend and extend scenario.
                    else if (line.SBQQ__ProductCode__c == potProdLst[j] && isTermExtended == true && potUpgradedSub == null && potIsCloned == false) {
                        debug('performPremiuSuccessCalculations pot within pot: potPrice#### potPrice: potUpgradedSub' + potUpgradedSub);
                        var pVolumeDiscount = 0;
                        if (line.SBQQ__DiscountTier__c != null) {
                            pVolumeDiscount = (1 - (line.SBQQ__RegularPrice__c / (line.SBQQ__ListPrice__c * line.SBQQ__ProrateMultiplier__c))) * 100;
                        }

                        var proratedUnitPrice = line.SBQQ__ListPrice__c * line.SBQQ__ProrateMultiplier__c * (1 - (pVolumeDiscount / 100));

                        if (priorQuantity != null && line.SBQQ__EffectiveQuantity__c > 0) {
                            proratedUnitPrice = proratedUnitPrice * line.SBQQ__EffectiveQuantity__c;
                        } else if (priorQuantity != null && line.SBQQ__EffectiveQuantity__c < 0) { //For Midterm Partial Upgrade Calcualtions
                            proratedUnitPrice = 0; //proratedUnitPrice * line.SBQQ__EffectiveQuantity__c *-1;
                        } else if (priorQuantity == null && line.SBQQ__EffectiveQuantity__c < 0) {
                            proratedUnitPrice = proratedUnitPrice * line.SBQQ__EffectiveQuantity__c * -1;
                        } else if (priorQuantity == null) {
                            proratedUnitPrice = proratedUnitPrice * line.SBQQ__Quantity__c;
                        } else {
                            proratedUnitPrice = 0;
                        }

                        debug('performPremiuSuccessCalculations pot within pot: potPrice#### potPrice: 2238' + potPrice);

                        potPrice += (proratedUnitPrice * (potPercent / 100));

                    } else if (line.SBQQ__ProductCode__c == potProdLst[j] && line.SBQQ__EndDate__c == endDate && line.SBQQ__Quantity__c > 0 && requiredBy == line.SBQQ__RequiredBy__c) {

                        var pVolumeDiscount = 0;
                        if (line.SBQQ__DiscountTier__c != null) {
                            pVolumeDiscount = (1 - (line.SBQQ__RegularPrice__c / (line.SBQQ__ListPrice__c * line.SBQQ__ProrateMultiplier__c))) * 100;
                        }

                        var proratedUnitPrice = line.SBQQ__ListPrice__c * line.SBQQ__ProrateMultiplier__c * (1 - (pVolumeDiscount / 100));

                        if (priorQuantity != null && line.SBQQ__EffectiveQuantity__c > 0) {
                            proratedUnitPrice = proratedUnitPrice * line.SBQQ__EffectiveQuantity__c;
                        } else if (priorQuantity != null && line.SBQQ__EffectiveQuantity__c < 0) { //For Midterm Partial Upgrade Calcualtions
                            proratedUnitPrice = 0; //proratedUnitPrice * line.SBQQ__EffectiveQuantity__c *-1;
                        } else if (priorQuantity == null && line.SBQQ__EffectiveQuantity__c < 0) {
                            proratedUnitPrice = proratedUnitPrice * line.SBQQ__EffectiveQuantity__c * -1;
                        } else if (priorQuantity == null) {
                            proratedUnitPrice = proratedUnitPrice * line.SBQQ__Quantity__c;
                        } else {
                            proratedUnitPrice = 0;
                        }

                        debug('performPremiuSuccessCalculations pot within pot: potPrice#### potPrice' + potPrice);

                        potPrice += (proratedUnitPrice * (potPercent / 100));

                    }
                });
            }

            debug('performPremiuSuccessCalculations: potPrice' + potproductId + potPrice);
            quoteLines.forEach(lineWrapper => {
                var ql = lineWrapper;
                if (ql.SBQQ__Product__c == potproductId && ql.SBQQ__EndDate__c == endDate && requiredBy == ql.SBQQ__RequiredBy__c && ql.Quote_Line_Type__c == null) {
                    setXDRPOTPrice(ql, potPrice);
                }
            });
            potPrice = 0;
        }
    }
}



function setXDRPOTPrice(ql, potPrice) {
    var sku = ql.Internal_SKU_Name__c;
    if (sku == null) {
        sku = ql.SBQQ__ProductCode__c;
    }

    if ((ql.Volume_Discount__c == null) || isNaN(ql.Volume_Discount__c)) {
        ql.Volume_Discount__c = 0;
    }
    if ((ql.Total_Discount__c == null) || isNaN(ql.Total_Discount__c)) {
        ql.Total_Discount__c = 0;
    }
    if ((ql.NSP_discount__c == null) || isNaN(ql.NSP_discount__c)) {
        ql.NSP_discount__c = 0;
    }
    if ((ql.Line_Default_Discount__c == null) || isNaN(ql.Line_Default_Discount__c)) {
        ql.Line_Default_Discount__c = 0;
    }


    ql.SBQQ__ListPrice__c = potPrice;

    ql.SBQQ__ProratedListPrice__c = potPrice;
    ql.SBQQ__RegularPrice__c = potPrice;
    ql.SBQQ__ProratedPrice__c = potPrice;
    ql.SBQQ__SpecialPrice__c = potPrice;

    var netTotalOverride = ql.Override_Net_Total__c;
    debug('*****setPOTPrice: sku ' + sku + ' netTotalOverride ' + netTotalOverride + ' ql.Total_Discount__c ' + ql.Total_Discount__c);
    if ((netTotalOverride != null) && (netTotalOverride >= 0)) {
        debug('*****setPOTPrice: updating total discount based on overridde for sku ' + sku + ' netTotalOverride ' + netTotalOverride);
        ql.Total_Discount__c = (1 - (netTotalOverride / price)) * 100;
        debug('*****setPOTPrice: updated total discount with overridde  for sku ' + sku + ' Total discount ' + ql.Total_Discount__c);
    }


    if (ql.Total_Discount__c < ql.Line_Default_Discount__c) {
        ql.Total_Discount__c = ql.Line_Default_Discount__c;
    }
    debug("*****setPOTPrice: sku " + sku + " SBQQ__Discount__c " + ql.SBQQ__Discount__c + " Total_Discount__c " + ql.Total_Discount__c + " Line_Default_Discount__c " + ql.Line_Default_Discount__c);

    if (ql.Total_Discount__c >= 0) {
        var nspDiscount = ql.Total_Discount__c - ql.Line_Default_Discount__c;
        if (nspDiscount < 0.01) {
            nspDiscount = 0;
            ql.Total_Discount__c = ql.Line_Default_Discount__c;
        }

        ql.SBQQ__Discount__c = ql.Total_Discount__c;
        ql.NSP_discount__c = nspDiscount;
        debug("*****setPOTPrice: sku " + sku + "  post nspDiscount " + nspDiscount);

        var netPrice = (potPrice * (100 - ql.Total_Discount__c)) / 100;
        ql.SBQQ__NetPrice__c = netPrice;
        ql.SBQQ__CustomerPrice__c = ql.SBQQ__RegularPrice__c;
        ql.SBQQ__PartnerPrice__c = ql.SBQQ__RegularPrice__c;
    } else {
        ql.SBQQ__NetPrice__c = potPrice;
        ql.SBQQ__CustomerPrice__c = ql.SBQQ__RegularPrice__c;
        ql.SBQQ__PartnerPrice__c = ql.SBQQ__RegularPrice__c;
        ql.NSP_discount__c = 0;
        ql.Total_Discount__c = 0;
    }
    debug("*****setPOTPrice: processing complete for sku " + sku + " SBQQ__Discount__c " + ql.SBQQ__Discount__c + " Total_Discount__c " + ql.Total_Discount__c + " NSP_discount__c " + ql.NSP_discount__c + " List Price " + ql.SBQQ__ListPrice__c + " Net Price " + ql.SBQQ__NetPrice__c);

}

function calculateCreditAmountForPOTProducts(quoteModel, quoteLines) {
    var creditPrice = 0;
    var creditProductList = [];
    var potAmountList = [];
    var potUpgradePriceList = [];

    debug('calculateCreditAmountForPOTProducts: Entered');
    quoteLines.forEach(lineWrapper => {
        var ql = lineWrapper.record;
        if (ql.SBQQ__SubscriptionPercent__c != null && ql.Internal_SKU_Name__c.indexOf('PAN-XDR-PREM') >= 0 && ql.Quote_Line_Type__c != null) {
            var potUpgrade = {};
            potUpgrade['upgradeAmount'] = ql.Upgrade_Credit_Amount__c;
            potUpgrade['endDate'] = ql.SBQQ__EndDate__c;
            potUpgradePriceList.push(potUpgrade);
        }
        if (ql.SBQQ__EffectiveQuantity__c < 0 && ql.Quote_Line_Type__c == null) {
            var creditMap = {};
            creditMap['quoteLineId'] = ql.Id;
            creditMap['endDate'] = ql.SBQQ__EndDate__c;
            creditMap['requiredBy'] = ql.SBQQ__RequiredBy__c;
            creditMap['processDate'] = ql.Process_Date__c;
            creditProductList.push(creditMap);
        }

    });

    debug('calculateCreditAmountForPOTProducts: creditProductList' + creditProductList.length);

    if (creditProductList.length > 0 && potUpgradePriceList.length > 0) {

        for (var i = 0; i < creditProductList.length; i++) {
            var prodMap = creditProductList[i];
            var quoteLineId = prodMap.quoteLineId;
            var prodEndDate = prodMap.endDate;
            var prodrequiredBy = prodMap.requiredBy;
            var prodProcessDate = prodMap.processDate;
            quoteLines.forEach(lineWrapper => {
                var ql = lineWrapper.record;
                if (ql.SBQQ__EffectiveQuantity__c < 0 && ql.SBQQ__EndDate__c == prodEndDate && ql.SBQQ__RequiredBy__c == prodrequiredBy) {
                    debug('performPremiuSuccessCalculations: SBQQ__RegularPrice__c' + ql.SBQQ__NetPrice__c);
                    for (var k = 0; k < potUpgradePriceList.length; k++) {
                        var upgradeMap = potUpgradePriceList[k];
                        var upgEndDate = upgradeMap.endDate;
                        var upgCreditAmount = upgradeMap.upgradeAmount;
                        if (ql.SBQQ__RequiredBy__c == prodrequiredBy) {
                            creditPrice = upgCreditAmount * ql.SBQQ__ProrateMultiplier__c;
                        }
                        debug('performPremiuSuccessCalculations: upgCreditAmount:creditPrice:' + creditPrice);
                    }
                    if (ql.SBQQ__Quantity__c > 0) {
                        creditPrice = creditPrice * (ql.SBQQ__EffectiveQuantity__c / ql.SBQQ__PriorQuantity__c) * -1;
                    }

                }
            });

            var potAmountMap = {};
            potAmountMap['creditAmount'] = creditPrice;
            potAmountMap['endDate'] = prodEndDate;
            potAmountMap['requiredBy'] = prodrequiredBy;
            potAmountMap['processDate'] = prodProcessDate;
            potAmountList.push(potAmountMap);
            debug('calculateCreditAmountForPOTProducts: creditPrice' + creditPrice);
            creditPrice = 0;
        }

        for (var j = 0; j < potAmountList.length; j++) {
            var potMap = potAmountList[j];
            var creditAmount = potMap.creditAmount;
            var endDate = potMap.endDate;
            var requiredBy = potMap.requiredBy;
            var processDate = potMap.processDate;
            debug('performPremiuSuccessCalculations: creditAmount' + creditAmount);

            quoteLines.forEach(lineWrapper => {
                var ql = lineWrapper.record;
                if (ql.SBQQ__SubscriptionPercent__c != null && ql.Internal_SKU_Name__c.indexOf('PAN-XDR-PREM') >= 0 && ql.SBQQ__EndDate__c == endDate && ql.Quote_Line_Type__c != null && requiredBy == ql.SBQQ__Source__c) {
                    debug('performPremiuSuccessCalculations: ql.Credit_Amount__c' + creditAmount);
                    ql.SBQQ__NetPrice__c = creditAmount;
                    ql.SBQQ__ListPrice__c = creditAmount;
                    ql.SBQQ__RegularPrice__c = creditAmount;
                    ql.SBQQ__ProratedListPrice__c = creditAmount;
                    ql.Process_Date__c = processDate;
                    ql.Line_Default_Discount__c = 0;
                    ql.Total_Discount__c = 0;
                    ql.SBQQ__Discount__c = 0;
                    ql.QLE_Lock_Fields__c = 'Process_Date__c,SBQQ__EndDate__c,Total_Discount__c,SBQQ__Quantity__c';
                }
            });

        }
    }

}

//EE - util function to set the net total
function overrideNetTotalOnAssets(ql) {
    if (ql != null) {
        var netPrice = ql.SBQQ__NetPrice__c;
        ql.SBQQ__NetPrice__c = netPrice * (ql.SBQQ__SubscriptionTerm__c / 12);
        ql.SBQQ__ProratedListPrice__c = ql.SBQQ__ListPrice__c * (ql.SBQQ__SubscriptionTerm__c / 12);;
        ql.SBQQ__RegularPrice__c = ql.SBQQ__ProratedListPrice__c;

    }
}
//XDR-2451 - recalculate XDR POT Totals. 
function quoteHasXdrPotProducts(quoteModel, quoteLines) {
    var quoteHasXDRPotProducts = false;
    if (quoteLines != null && quoteModel != null) {
        quoteLines.forEach(function(lineWrapper) {
            var prodGrp = lineWrapper.record.Product_Group__c;
            var potProds = lineWrapper.record.POT_Products__c;
            var family = lineWrapper.record.SBQQ__ProductFamily__c;
            var sku = getProductSKU(lineWrapper);
            if ((prodGrp && prodGrp.indexOf('XDR') >= 0 && potProds && potProds.length > 0) || (family != null && family.indexOf('Crypsis') >= 0) || 
                (CONSTANTS.EXTENDED_EXPERTISEPS_SKU.indexOf(sku) >= 0 || CONSTANTS.EXTENDED_EXPERTISEPS_CLEARANCE_SKU.indexOf(sku) >= 0 || CONSTANTS.EXTENDED_EXPERTISEPS_MONTH_SKU.indexOf(sku) >=0  || 
                    CONSTANTS.EXTENDED_EXPERTISEPS_ADDON_SKU.indexOf(sku) >= 0)) {
                quoteHasXDRPotProducts = true;
            }
        });
    }
    console.log(' ==== quoteHasXdrPotProducts ==== ', quoteHasXDRPotProducts);
    return quoteHasXDRPotProducts;
}


var CONSTANTS = {
    "PRICEOVERRIDEGROUP": "MKTP Price Override Group",
    "IGNOREVOLUMEDISCOUNT": "OVERRIDE VOLUME DISCOUNT",
    "VOLUMEDISCOUNTCUTOFFDATE": "2019-12-04T00:00:00",
    "BACKLINESUPPORTTYPE": "Premium Partner",
    "UPGRADEQUOTETYPE": "Upgrade",
    "PARTIALUPGRADEQUOTETYPE": "Partial Upgrade",
    "DEBUG": true,
    "RENEW": "Renewal",
    "AMEND": "Amendment",
    "NEW": "Quote",
    "POT": "Percent Of Total",
    "REDLOCKPG": "RedLock",
    "TWISTLOCKPG": "TwistLock",
    "DEMISTOPG": "Demisto",
    "XDRPG": "XDR",
    "NFRPG": "XDR NFR",
    SUPPORTTYPE: "Partner",
    "EXTENDED_EXPERTISEPS_SKU": "PAN-CONSULT-EE-BASE,PAN-CONSULT-EE-PLUS,PAN-CONSULT-EE-DEDICATED-BASE,PAN-CONSULT-EE-DEDICATED-PLUS",
    "EXTENDED_EXPERTISEPS_MONTH_SKU": "PAN-CONSULT-EE-1MO-EXT,PAN-CONSULT-EE-DEDICATED-1MO-EXT",
    "EXTENDED_EXPERTISEPS_ADDON_SKU": "PAN-CONSULT-EE-ADDON-CREDITS,PAN-CONSULT-EE-ADDON-CLEARANCE",
    "EXTENDED_EXPERTISEPS_CLEARANCE_SKU": "PAN-CONSULT-EE-ADDON-CLEARANCE",

    "REDLOCK": "PRISMA PUBLIC CLOUD,PAN-PRISMA-PUBCLOUD-BUS,PAN-PRISMA-PUBCLOUD-ENT,PAN-PRISMA-PUBCLOUD-BUS-ACT,PAN-PRISMA-PUBCLOUD-ENT-ACT",
    "REDLOCKSUPPORT": "PAN-PRISMA-PUBCLOUD-PREM-SUCCESS",
    "TWISTLOCK": "PRISMA TWISTLOCK,PAN-PRISMA-TWISTLOCK,PAN-PRISMA-TWISTLOCK-HOST",
    "TWISTLOCKSUPPORT": "PAN-PRISMA-TWSTLOCK-PREM-SUCCESS",
    "DUMMYPRODUCTS": "PAN-PRISMA-PUBCLOUD-PREM-SUCCESS-UPG,PAN-PRISMA-TWSTLOCK-PREM-SUCCESS-UPG",
    "DEMISTOSUPPORT": "PAN-DEMISTO-PREMIUM-SUCCESS,PAN-DEMISTO-PREMIUM-SUPPORT,PAN-CORTEXXSOAR-PREMIUM-SUCCESS-USG,PAN-CORTEXXSOAR-PREMIUM-SUPPORT-USG",
    "DEMISTOHOSTING": "PAN-DEMISTO-HOSTING-ENTERPRISE",
    "DEMISTOBASELINE": "PAN-DEMISTO-ENTERPRISE-BASE,PAN-DEMISTO-MSSP-BASE,PAN-DEMISTO-PERPETUAL-BASE,PAN-CORTEXXSOAR-TIM-ENTERPRISE,PAN-CORTEXXSOAR-ENTERPRISE,",
    "PAN-DEMISTO-ENTERPRISE-BASE": "PAN-DEMISTO-AUDIT-USER-ENT,PAN-DEMISTO-FULL-USER-ENT,PAN-DEMISTO-HOSTING-ENT,",
    "PAN-CORTEXXSOAR-TIM-ENTERPRISE": "PAN-DEMISTO-AUDIT-USER-ENT,PAN-DEMISTO-FULL-USER-ENT,PAN-DEMISTO-HOSTING-ENT,",
    "PAN-CORTEXXSOAR-ENTERPRISE": "PAN-DEMISTO-AUDIT-USER-ENT,PAN-DEMISTO-FULL-USER-ENT,PAN-DEMISTO-HOSTING-ENT,",
    "PAN-DEMISTO-MSSP-BASE": "PAN-DEMISTO-AUDIT-USER-MSSP,PAN-DEMISTO-FULL-USER-MSSP,PAN-DEMISTO-MSSP-TEN",
    "PAN-DEMISTO-PERPETUAL-BASE": "PAN-DEMISTO-AUDIT-USER-PERP,PAN-DEMISTO-FULL-USER-PERP,PAN-DEMISTO-PREMIUM-SUPPORT",
    PERPETUAL_POT: "PAN-DEMISTO-PREMIUM-SUPPORT,PAN-CORTEXXSOAR-PREMIUM-SUPPORT-USG",
    PERPETUAL_SKU_LIST: "PAN-DEMISTO-PERPETUAL-AUDIT-USER,PAN-DEMISTO-PERPETUAL-FULL-USER, PAN-DEMISTO-FULL-USER-PERP,PAN-DEMISTO-AUDIT-USER-PERP,PAN-DEMISTO-PERPETUAL-BASE,PAN-DEMISTO-PERPETUAL,PAN-CORTEXXSOAR-TIM-PERPETUAL-BASE,PAN-CORTEXXSOAR-PERPETUAL-BASE",
    XDRMTHLIST: "PAN-XDR-MTH,PAN-XDR-MTH-NFR,PAN-XDR-MTH-BKLN,PAN-XDR-MTH-USG,PAN-XDR-MTH-BKLN-USG",
    XDRPROSKULIST: "PAN-XDR-P-1TB,PAN-XDR-ADV-1TB,PAN-XDR-ADV-EP,PAN-XDR-ADV-EP-BKLN,PAN-XDR-ADV-1TB-BKLN,PAN-XDR-ADV-1TB-USG,PAN-XDR-ADV-EP-USG,PAN-XDR-ADV-EP-USG-BKLN,PAN-XDR-ADV-1TB-USG-BKLN,PAN-XDR-ADV-NOCDL-1TB,PAN-XDR-ADV-NOCDL-1TB-BKLN",
    XDR_BASE_SELECT_SKU_LIST_FOR_AUTO_ATTACH: "PAN-XDR-PREVENT,PAN-XDR-ADV-EP",
    XDR_AUTO_ATTACH_SKU_LIST: "PAN-CONSULT-XDR-EP-QS-BRONZE,PAN-CONSULT-XDR-EP-QS-SILVER,PAN-CONSULT-XDR-EP-QS-GOLD",
    PS_EP_QS_BRONZE: "PAN-CONSULT-XDR-EP-QS-BRONZE",
    PS_EP_QS_SILVER: "PAN-CONSULT-XDR-EP-QS-SILVER",
    PS_EP_QS_GOLD: "PAN-CONSULT-XDR-EP-QS-GOLD",
    TE_BASE_SKU: "PAN-CONSULT-TE-BASE-3D",
    TE_ADD_ON_SKU_LIST: "PAN-CONSULT-TE-ADDON-1D,PAN-CONSULT-TE-ADDON-MISC",
    PS_APPROVAL_CATEGORY: "E,TE",
    CRYPSIS_SKU_LIST: "PAN-CES-RET-LVL1,PAN-CES-RET-LVL2,PAN-CES-RET-LVL3,PAN-CES-RET-LVL4,PAN-CES-SLA-UPG",
    "PAN_CONSULT_PRJM_DAY": "PAN-CONSULT-PRJM-DAY",
    //"PAN_CONSULT_CUSTOM": "PAN-CONSULT-CUSTOM",
    "PAN_CONSULT_XSOAR_TIM_QS": "PAN-CONSULT-XSOAR-TIM-QS",
    "PAN_CONSULT_XSOAR_ENT_QS": "PAN-CONSULT-XSOAR-ENT-QS",
    "PAN_CONSULT_XSOAR_OPT": "PAN-CONSULT-XSOAR-OPT",
    "HOSTINSIGHTS": "PAN-XDR-HOST-INST",
    "HSTCONTRACT": "HI Custom Discounts",
    QUOTE_STATUS: {
        PENDING: "Pending"
    },
    "THEATRE": {
        "NORTH_AMERICA": "North America"
    },
    "IS_DISTI_OR_RESELLER_QUOTE": {
        "IS_DISTI_QUOTE": "isDistiQuote"
    },
    "DISCOUNT_TYPE": {
        "BASE_DISCOUNT": "Base Discount"
    },
    "BASE_DISCOUNT_DATA": {
        "NAM": {
            "A": 15,
            "B": 15,
            "C": 8,
            "D": 15,
            "E": 8,
            "G": 15,
            "L": 13,
            "NFR": 0,
            "LAB": 0
        },
        "INTL": {
            "A": 20,
            "B": 20,
            "C": 10,
            "D": 20,
            "E": 8,
            "G": 20,
            "L": 15,
            "NFR": 0,
            "LAB": 0
        }
    },
    "SUBSCRIPTION_TYPE": {
        "RENEWABLE": "Renewable"
    },
    "TO_SET_PRIMARY_STATUS": {
        "PRIMARY": "Primary",
        "UNPRIMARY": "Unprimary"
    },
    PRICING_DIRECTIVE: {
        AFTER_PENDING: "AfterPending"
    }
};
