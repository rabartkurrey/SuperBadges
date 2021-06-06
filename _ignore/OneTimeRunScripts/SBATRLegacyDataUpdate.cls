/**
 * @File Name          : SBATRDataLinkScriptToUpdateLegacyData.cls
 * @Description        : 
 * @Author             : Venkata Nitin Kolluri
 * @Group              : 
 * @Last Modified By   : Venkata Nitin Kolluri
 * @Last Modified On   : 6/25/2020, 3:07:11 PM
 * @Modification Log   : 
 * Ver       Date            Author      		    Modification
 * 1.0    6/24/2020   Venkata Nitin Kolluri    Initial Version
 * RUN THE SCRIPT TWICE ONCE FOR QL AND ONCE FOR SUBSCRIPTION
 Total Subscriptions = 14285
 subscriptions without quoteline = 9035(with opp on contract - 7 and without opp on contract 9028)
 Subscriptions with quoteline = 5250
 subscriptions without quoteline and with order = 306(302 - amendment, 2 - Quote, 2 - Renewal)
 subscriptions without quoteline and without order = 8729
 Amended QuoteLine with upgraded subscriptions as NULL - 1404
 Amended Quoteline with upgraded subscriptions - 3903
 Renewed Quoteline with Renewed subscriptions - 7678
 Renewed Quoteline with Renewed subscriptions as NULL - 2482
 Total 4032 subscriptions which are tied as Renewed or Upgradedsubscription on quote line(UpgragedSubsription on QL - 1381, RenewedSubscription on QL - 3159)
 Production updates:
 Renewal: 2712
 Amendment: 890
 new SBATRDataLinkScriptToUpdateLegacyData().populateSubcriptionFieldsDataNew('2019-08-10T00:00:00.000+0000', '2020-07-16T00:00:00.000+0000', 'Renewal');
Original Story: https://jira.paloaltonetworks.com:8443/browse/NOVACPQ-851
**/

public class SBATRLegacyDataUpdate {
    /*
     ** Update the RelatedSubscription on QuoteLine for Amend & Renewals
     ** #3047
     ** Disable Package Triggers, Opportunity triggers(control flag Custom setting for logged in user - disable trigger = true and Opportunity trigger setting fire = false)
     ** Disable Quote and QuoteLine trigger (Custom Metadata - Disable_Quote_trigger and Disable_QuoteLine_Trigger)
     */
    public void populateRelatedSubscriptionsData(String stDate, String endDt, String type) {
        DateTime startDate = Datetime.valueOf(stDate.replace('T', ' '));
        DateTime endDate = Datetime.valueOf(endDt.replace('T', ' '));
        Set<String> relatedProductIds = new Set<String>();
        Set<String> renewalQuoteContracts = new Set<String>();
        Map<Id, SBQQ__QuoteLine__c> mapRenewalAddonUpgradeQLs = new Map<Id, SBQQ__QuoteLine__c>();
        Map<Id, SBQQ__QuoteLine__c> renewSubQLMap = new Map<Id, SBQQ__QuoteLine__c>();
        Map<Id, SBQQ__Subscription__c> subMap = new Map<Id, SBQQ__Subscription__c>();
        Map<String, Id> qtProdByUpgradedSUb = new Map<String, Id>();
        Boolean updateSub = false;
        if (type.equalsIgnoreCase('Amendment')) {
            for (SBQQ__QuoteLine__c eQL : [
                SELECT
                    ID,
                    Name,
                    SBQQ__Quote__c,
                    SBQQ__Quote__r.SBQQ__Type__c,
                    SBQQ__Product__c,
                    SBQQ__RenewedSubscription__c,
                    SBQQ__UpgradedSubscription__c,
                    SBQQ__PriorQuantity__c,
                    Related_Subscription__c,
                    SBQQ__Quote__r.Original_Contract__c,
                    SBQQ__Quote__r.Original_Contract__r.SBQQ__Quote__c,
                    SBQQ__Quantity__c,
                    SBQQ__StartDate__c,
                    SBQQ__EndDate__c,
                    SBQQ__Quote__r.SBQQ__Opportunity2__r.Distributor__c,
                    SBQQ__Quote__r.SBQQ__Opportunity2__r.Distributor_Name__c,
                    SBQQ__Quote__r.SBQQ__Opportunity2__r.Second_Tier_Reseller__c,
                    SBQQ__Quote__r.SBQQ__Opportunity2__r.Reseller_Name__c,
                    SBQQ__Quote__r.SBQQ__Status__c,
                    SBQQ__Quote__r.SBQQ__Primary__c,
                    (SELECT Id, SBQQ__Contracted__c FROM SBQQ__OrderProducts__r)
                FROM SBQQ__QuoteLine__c
                WHERE
                    lastmodifieddate > :startDate
                    AND lastmodifieddate < :endDate
                    AND SBQQ__Quote__r.SBQQ__Status__c != 'Rejected'
                    AND SBQQ__Quote__r.SBQQ__Type__c = 'Amendment'
                    AND SBQQ__Quote__r.SBQQ__Opportunity2__r.StageName NOT IN ('0 - Closed Lost')
                ORDER BY lastmodifieddate ASC
            ]) {
                //order by lastmodifieddate ******************
                if (eQL.SBQQ__UpgradedSubscription__c != null) {
                    qtProdByUpgradedSUb.put(eQL.sbqq__Quote__c + '-' + eQL.SBQQ__Product__c, eQL.SBQQ__UpgradedSubscription__c);
                }
            }
        }
        //Fetch all the QuoteLines and update the RelatedSubscription field for the Amend & Renewed Quotes Only
        // can only do this on Pending quote lines
        //only for pending status
        List<SBQQ__QuoteLine__c> lst = new List<SBQQ__QuoteLine__c>();
        for (SBQQ__QuoteLine__c eachQL : [
            SELECT
                ID,
                Name,
                SBQQ__Quote__c,
                SBQQ__Quote__r.SBQQ__Type__c,
                SBQQ__Product__c,
                SBQQ__RenewedSubscription__c,
                SBQQ__UpgradedSubscription__c,
                SBQQ__PriorQuantity__c,
                Related_Subscription__c,
                SBQQ__Quote__r.Original_Contract__c,
                SBQQ__Quote__r.Original_Contract__r.SBQQ__Quote__c,
                SBQQ__Quantity__c,
                SBQQ__StartDate__c,
                SBQQ__EndDate__c,
                SBQQ__Quote__r.SBQQ__Opportunity2__r.Distributor__c,
                SBQQ__Quote__r.SBQQ__Opportunity2__r.Distributor_Name__c,
                SBQQ__Quote__r.SBQQ__Opportunity2__r.Second_Tier_Reseller__c,
                SBQQ__Quote__r.SBQQ__Opportunity2__r.Reseller_Name__c,
                SBQQ__Quote__r.SBQQ__Status__c,
                SBQQ__Quote__r.SBQQ__Primary__c,
                SBQQ__Quote__r.SBQQ__Ordered__c,
                (SELECT Id, SBQQ__Contracted__c FROM SBQQ__OrderProducts__r)
            FROM SBQQ__QuoteLine__c
            WHERE
                lastmodifieddate > :startDate
                AND lastmodifieddate < :endDate
                AND SBQQ__Quote__r.SBQQ__Status__c != 'Rejected'
                AND SBQQ__Quote__r.SBQQ__Type__c = :type
                AND SBQQ__Quote__r.SBQQ__Opportunity2__r.StageName NOT IN ('0 - Closed Lost')
            ORDER BY lastmodifieddate ASC
        ]) {
            system.debug('eachql: ' + eachQL);
            SBQQ__Subscription__c sub;

            //If the Quote is Amended, then populate the  SBQQ__UpgradedSubscription__c to Related_Subscription__c field on QL
            if (eachQL.SBQQ__Quote__r.SBQQ__Type__c == 'Amendment') {
                Id upgSubs = qtProdByUpgradedSUb.get(eachQL.SBQQ__Quote__c + '-' + eachQL.SBQQ__Product__c);

                if (upgSubs != null) {
                    if (!subMap.containsKey(upgSubs)) {
                        sub = new SBQQ__Subscription__c();
                        sub.Id = upgSubs;
                    } else {
                        sub = subMap.get(upgSubs);
                    }
                    if (eachQL.SBQQ__Quote__r.SBQQ__Type__c == 'Amendment') {
                        //if the quote is not rejected
                        if (eachQL.SBQQ__OrderProducts__r.size() > 0 && eachQL.SBQQ__Quote__r.SBQQ__Ordered__c) {
                            sub.LastAmend_StartDate__c = eachQL.SBQQ__StartDate__c; //This has to be done only if the order is contracted. check by adding subquery in the above soql
                            if (sub.SBQQ__Quantity__c != eachQL.SBQQ__Quantity__c && eachQL.SBQQ__PriorQuantity__c != null) {
                                sub.EffectiveQuantity__c = eachQL.SBQQ__Quantity__c;
                            }
                            if (sub.SBQQ__EndDate__c < eachQL.SBQQ__EndDate__c && eachQL.SBQQ__PriorQuantity__c == null) {
                                sub.EffectiveEndDate__c = eachQL.SBQQ__EndDate__c;
                            }
                            sub.Curr_QuoteLine__c = null;
                            sub.Curr_Approved_QuoteLine__c = null;
                            sub.Curr_Primary_QuoteLine__c = null;
                            updateSub = true;
                        }

                        if (
                            !eachQL.SBQQ__Quote__r.SBQQ__Ordered__c &&
                            ((subMap.containsKey(sub.Id) && subMap.get(sub.Id).LastAmend_StartDate__c == null) || !subMap.containsKey(sub.Id))
                        ) {
                            sub.Curr_QuoteLine__c = eachQL.Id;
                            if (eachQL.SBQQ__Quote__r.SBQQ__Status__c == 'Approved' || eachQL.SBQQ__Quote__r.SBQQ__Status__c == 'Approved - Sent to Disti') {
                                sub.Curr_Approved_QuoteLine__c = eachQL.Id;
                            }
                            if (eachQL.SBQQ__Quote__r.SBQQ__Primary__c) {
                                sub.Curr_Primary_QuoteLine__c = eachQL.Id;
                            }
                            updateSub = true;
                        }
                    }
                    if (updateSub) {
                        subMap.put(sub.Id, sub);
                    }
                }
                //Do we need to populate the QuotingStatus? in this case
            } else if (eachQL.SBQQ__Quote__r.SBQQ__Type__c == 'Renewal') {
                //if the quote is not rejected
                //This is direct Renewal - No Upgrade/Downgrade/AddOn
                if (eachQL.SBQQ__RenewedSubscription__c != null) {
                    renewSubQLMap.put(eachQL.SBQQ__RenewedSubscription__c, eachQL);
                    if (!subMap.containsKey(eachQL.SBQQ__RenewedSubscription__c)) {
                        sub = new SBQQ__Subscription__c();
                        sub.Id = eachQL.SBQQ__RenewedSubscription__c;
                    } else {
                        sub = subMap.get(eachQL.SBQQ__RenewedSubscription__c);
                    }
                    //effectivequantity and enddate should be populated only when order is placed
                    if (eachQL.SBQQ__Quote__r.SBQQ__Ordered__c) {
                        sub.EffectiveQuantity__c = eachQL.SBQQ__Quantity__c;
                        sub.EffectiveEndDate__c = eachQL.SBQQ__EndDate__c;
                    }
                    sub.Curr_QuoteLine__c = eachQL.Id;
                    if (eachQL.SBQQ__Quote__r.SBQQ__Status__c == 'Approved' || eachQL.SBQQ__Quote__r.SBQQ__Status__c == 'Approved - Sent to Disti') {
                        sub.Curr_Approved_QuoteLine__c = eachQL.Id;
                    }
                    if (eachQL.SBQQ__Quote__r.SBQQ__Primary__c) {
                        sub.Curr_Primary_QuoteLine__c = eachQL.Id;
                    }

                    subMap.put(sub.Id, sub);
                } else {
                    System.debug('entered else');
                    //Incase of AddOn/Upgrade/Renewal -  SBQQ__RenewedSubscription__c will be BLANK on QL
                    //Check for the ProductRelation Configuration Data for these items and update the data accordingly
                    relatedProductIds.add(eachQL.SBQQ__Product__c);
                    System.debug('relatedproductids: ' + relatedProductIds);
                    System.debug('OriginalContractNumber__c: ' + eachQL.SBQQ__Quote__r.Original_Contract__c);
                    if (String.isNotBlank(eachQL.SBQQ__Quote__r.Original_Contract__c)) {
                        renewalQuoteContracts.add(eachQL.SBQQ__Quote__r.Original_Contract__c);
                        mapRenewalAddonUpgradeQLs.put(eachQL.Id, eachQL);
                    }
                }
            }
        }

        System.debug('mapRenewalAddonUpgradeQLs::' + mapRenewalAddonUpgradeQLs);
        //Update the remaining QL for Renewal Scenarios
        if (!relatedProductIds.isEmpty()) {
            //If not matching products then do nothing
            //Prepare the Product Config Map
            Map<Id, Set<Id>> mapPRConfig = new Map<Id, Set<Id>>();
            List<Product_Relation__c> lstProductRelations = [
                SELECT id, Related_Product__c, Current_Product__c, Relation__c, Scope__c
                FROM Product_Relation__c
                WHERE Related_Product__c IN :relatedProductIds
            ];

            for (Product_Relation__c pr : lstProductRelations) {
                if (mapPRConfig.get(pr.Related_Product__c) == null) {
                    mapPRConfig.put(pr.Related_Product__c, new Set<Id>{ pr.Current_Product__c });
                } else {
                    (mapPRConfig.get(pr.Related_Product__c)).add(pr.Current_Product__c);
                }
            }
            System.debug('mapPRConfig::' + mapPRConfig);

            //Check the QL Product associated product in the Subscriptions
            List<SBQQ__Subscription__c> querySubscriptionsForContract = [
                SELECT Id, Name, SBQQ__QuoteLine__c, Curr_QuoteLine__c, SBQQ__Product__c, SBQQ__QuoteLine__r.SBQQ__Product__c, SBQQ__Contract__c
                FROM SBQQ__Subscription__c
                WHERE SBQQ__Contract__c IN :renewalQuoteContracts
            ]; //SBQQ__QuoteLine__c

            system.debug('subscriptions: ' + querySubscriptionsForContract);
            Map<Id, List<SBQQ__Subscription__c>> conBySubListMap = new Map<Id, List<SBQQ__Subscription__c>>();
            Map<Id, SBQQ__Subscription__c> mapSubscriptions = new Map<Id, SBQQ__Subscription__c>();
            for (SBQQ__Subscription__c sub : querySubscriptionsForContract) {
                if (!conBySubListMap.containsKey(sub.SBQQ__Contract__c)) {
                    conBySubListMap.put(sub.SBQQ__Contract__c, new List<SBQQ__Subscription__c>{ sub });
                } else {
                    conBySubListMap.get(sub.SBQQ__Contract__c).add(sub);
                }
                if (sub.SBQQ__QuoteLine__c != null) {
                    mapSubscriptions.put(sub.SBQQ__QuoteLine__c, sub);
                }
            }

            //Set the Related_Subscription__c on QL based on PR Config and Subscription Product
            for (SBQQ__QuoteLine__c sbQL : mapRenewalAddonUpgradeQLs.values()) {
                //Populate the Upgrade/Downgrade scenario
                if (mapPRConfig.get(sbQL.SBQQ__Product__c) != null) {
                    Set<Id> setProductChangeFrom = mapPRConfig.get(sbQL.SBQQ__Product__c);
                    system.debug('Found mapping for ::' + sbQL.SBQQ__Product__c + '::LIST setProductChangeFrom::' + setProductChangeFrom);
                    if (!setProductChangeFrom.isEmpty()) {
                        for (SBQQ__Subscription__c subScription : conBySubListMap.get(sbQL.SBQQ__Quote__r.Original_Contract__c)) {
                            system.debug('Subscription Product::' + subScription.SBQQ__Product__c);
                            system.debug('::Sub QL Product::' + subScription.SBQQ__QuoteLine__r.SBQQ__Product__c);
                            if (setProductChangeFrom.contains(subScription.SBQQ__Product__c)) {
                                renewSubQLMap.put(subscription.Id, sbQL);
                                SBQQ__Subscription__c sub;
                                if (!subMap.containsKey(subScription.Id)) {
                                    sub = new SBQQ__Subscription__c();
                                    sub.Id = subScription.Id;
                                } else {
                                    sub = subMap.get(subScription.Id);
                                }
                                if (sbQL.SBQQ__Quote__r.SBQQ__Ordered__c) {
                                    sub.EffectiveQuantity__c = sbQL.SBQQ__Quantity__c;
                                    sub.EffectiveEndDate__c = sbQL.SBQQ__EndDate__c;
                                }
                                sub.Curr_QuoteLine__c = sbQL.Id;
                                if (sbQL.SBQQ__Quote__r.SBQQ__Status__c == 'Approved') {
                                    sub.Curr_Approved_QuoteLine__c = sbQL.Id;
                                }
                                if (sbQL.SBQQ__Quote__r.SBQQ__Primary__c) {
                                    sub.Curr_Primary_QuoteLine__c = sbQL.Id;
                                }
                                subMap.put(sub.Id, sub);
                            }
                        }
                    }
                }
            }
        }
        if (!subMap.isEmpty()) {
            system.debug('submap size: ' + subMap.size());
            update subMap.values();
        }
    }

    // add StartDate, EndDate for QL as the arguments for this function
    public void populateSubcriptionFieldsDataNew(String stDate, String endDt, String type) {
        DateTime startDate = Datetime.valueOf(stDate.replace('T', ' '));
        DateTime endDate = Datetime.valueOf(endDt.replace('T', ' '));
        Map<Id, SBQQ__Subscription__c> subMap = new Map<Id, SBQQ__Subscription__c>();
        for (SBQQ__Subscription__c eachSub : [
            SELECT
                Id,
                SBQQ__QuoteLine__c,
                Curr_QuoteLine__c,
                Curr_Approved_QuoteLine__c,
                Curr_Primary_QuoteLine__c,
                Primary_Quote__c,
                EffectiveEndDate__c,
                EffectiveQuantity__c,
                SBQQ__Product__c,
                SBQQ__Product__r.ProductCode,
                PrevOpportunity__c,
                SBQQ__EndDate__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c,
                SBQQ__QuoteLine__r.SBQQ__StartDate__c,
                SBQQ__QuoteLine__r.SBQQ__EndDate__c,
                SBQQ__QuoteLine__r.SBQQ__Quantity__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Opportunity2__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.Original_Contract__r.SBQQ__Opportunity__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Opportunity2__r.Distributor__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Opportunity2__r.Distributor_Name__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Opportunity2__r.Second_Tier_Reseller__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Opportunity2__r.Reseller_Name__c,
                SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Distributor__c,
                SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Distributor_Name__c,
                SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Second_Tier_Reseller__c,
                SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Reseller_Name__c,
                SBQQ__Contract__r.SBQQ__Opportunity__c,
                SBQQ__Contract__r.SBQQ__Order__r.OpportunityId,
                SBQQ__ContractNumber__c,
                Incumbent_Distributor__c,
                Incumbent_Reseller__c
            FROM SBQQ__Subscription__c
            WHERE createddate > :startDate AND createddate < :endDate AND SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c = :type
        ]) {
            Boolean updateSub = false;
            if (eachSub.SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c == 'Quote' || eachSub.SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c == 'Renewal') {
                if (eachSub.EffectiveQuantity__c == null && eachSub.SBQQ__QuoteLine__r.SBQQ__Quantity__c != null) {
                    eachSub.EffectiveQuantity__c = eachSub.SBQQ__QuoteLine__r.SBQQ__Quantity__c;
                    updateSub = true;
                }
                if (eachSub.EffectiveEndDate__c == null && eachSUb.SBQQ__QuoteLine__r.SBQQ__EndDate__c != null) {
                    eachSub.EffectiveEndDate__c = eachSUb.SBQQ__QuoteLine__r.SBQQ__EndDate__c;
                    updateSub = true;
                }
            }
            //To update the prev oppportunity use eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity*********
            if (eachSub.PrevOpportunity__c == null && eachSub.SBQQ__Contract__r.SBQQ__Order__c != null) {
                eachSub.PrevOpportunity__c = eachSub.SBQQ__Contract__r.SBQQ__Order__r.OpportunityId;
                updateSub = true;
            }
            if (eachSub.Incumbent_Distributor__c == null) {
                if (eachSub.SBQQ__Contract__r.SBQQ__Order__c != null && eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Distributor__c != null) {
                    eachSub.Incumbent_Distributor__c =
                        '<a href=' +
                        System.URL.getSalesforceBaseUrl().toExternalForm() +
                        '/' +
                        eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Distributor__c +
                        ' >' +
                        eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Distributor_Name__c +
                        '</a>';
                } else if (
                    eachSub.SBQQ__Contract__r.SBQQ__Order__c == null &&
                    eachSub.SBQQ__Contract__r.SBQQ__Opportunity__c != null &&
                    eachSub.SBQQ__Contract__r.SBQQ__Opportunity__r.Distributor__c != null
                ) {
                    eachSub.Incumbent_Distributor__c =
                        '<a href=' +
                        System.URL.getSalesforceBaseUrl().toExternalForm() +
                        '/' +
                        eachSub.SBQQ__Contract__r.SBQQ__Opportunity__r.Distributor__c +
                        ' >' +
                        eachSub.SBQQ__Contract__r.SBQQ__Opportunity__r.Distributor_Name__c +
                        '</a>';
                }
                updateSub = true;
            }
            if (eachSub.Incumbent_Reseller__c == null) {
                if (eachSub.SBQQ__Contract__r.SBQQ__Order__c != null && eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Second_Tier_Reseller__c != null) {
                    eachSub.Incumbent_Reseller__c =
                        '<a href=' +
                        System.URL.getSalesforceBaseUrl().toExternalForm() +
                        '/' +
                        eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Second_Tier_Reseller__c +
                        ' >' +
                        eachSub.SBQQ__Contract__r.SBQQ__Order__r.Opportunity.Reseller_Name__c +
                        '</a>';
                } else if (
                    eachSub.SBQQ__Contract__r.SBQQ__Order__c == null &&
                    eachSub.SBQQ__Contract__r.SBQQ__Opportunity__c != null &&
                    eachSub.SBQQ__Contract__r.SBQQ__Opportunity__r.Second_Tier_Reseller__c != null
                ) {
                    eachSub.Incumbent_Reseller__c =
                        '<a href=' +
                        System.URL.getSalesforceBaseUrl().toExternalForm() +
                        '/' +
                        eachSub.SBQQ__Contract__r.SBQQ__Opportunity__r.Second_Tier_Reseller__c +
                        ' >' +
                        eachSub.SBQQ__Contract__r.SBQQ__Opportunity__r.Reseller_Name__c +
                        '</a>';
                }
                updateSub = true;
            }
            if (updateSub)
                subMap.put(eachSub.Id, eachSub);
        }
        if (subMap.size() > 0) {
            update subMap.values();
        }
    }

    public void populateQuotingStatusForSubRenewal(Integer lmt) {
        List<SBQQ__Subscription__c> subscriptions = [
            SELECT
                id,
                SBQQ__QuoteLine__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Status__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c,
                SBQQ__StartDate__c,
                SBQQ__EndDate__c,
                Curr_Primary_QuoteLine__c,
                Curr_Primary_QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c,
                QuotingStatus__c
            FROM SBQQ__Subscription__c
            WHERE Curr_Primary_QuoteLine__r.SBQQ__Quote__r.SBQQ__Status__c = 'Order Placed' AND Curr_Primary_QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c = 'Renewal'
            ORDER BY CreatedDate DESC
        ];
        List<SBQQ__Subscription__c> subList = new List<SBQQ__Subscription__c>();
        integer i = 0;
        for (SBQQ__Subscription__c sub : subscriptions) {
            if (i < lmt && sub.QuotingStatus__c == null) {
                sub.QuotingStatus__c = 'Renewed';
                subList.add(sub);
                i++;
            }
        }
        if (subList.size() > 0) {
            update subList;
        }
    }

    public void populateQuotingStatusForSubAmendment(Integer lmt) {
        Map<String, SBQQ__Subscription__c> contractProdBySubscription = new Map<String, SBQQ__Subscription__c>();
        List<SBQQ__Subscription__c> subscriptions = [
            SELECT
                Id,
                SBQQ__QuoteLine__c,
                SBQQ__EndDate__c,
                SBQQ__Quantity__c,
                QuotingStatus__c,
                SBQQ__Contract__c,
                SBQQ__Product__c,
                SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c,
                SBQQ__OrderProduct__c,
                SBQQ__OrderProduct__r.order.Mktp_Quote_Type__c,
                SBQQ__OrderProduct__r.SBQQ__Contracted__c,
                SBQQ__QuoteLine__r.SBQQ__UpgradedSubscription__c,
                SBQQ__QuoteLine__r.SBQQ__UpgradedSubscription__r.SBQQ__EndDate__c,
                SBQQ__QuoteLine__r.SBQQ__UpgradedSubscription__r.SBQQ__Quantity__c
            FROM SBQQ__Subscription__c
        ];
        for (SBQQ__Subscription__c s : subscriptions) {
            if (s.SBQQ__QuoteLine__c != null && s.SBQQ__QuoteLine__r.SBQQ__Quote__r.SBQQ__Type__c != 'Amendment') {
                contractProdBySubscription.put(s.SBQQ__Contract__c + '-' + s.SBQQ__Product__c, s);
            }
        }
        List<SBQQ__Subscription__c> subList = new List<SBQQ__Subscription__c>();
        integer i = 0;
        for (SBQQ__Subscription__c s : subscriptions) {
            if (i < lmt) {
                if (s.QuotingStatus__c == null && s.SBQQ__OrderProduct__c != null && s.SBQQ__OrderProduct__r.order.Mktp_Quote_Type__c == 'Amendment' && s.SBQQ__OrderProduct__r.SBQQ__Contracted__c) {
                    if (s.SBQQ__QuoteLine__r.SBQQ__UpgradedSubscription__c != null) {
                        if (s.SBQQ__EndDate__c > s.SBQQ__QuoteLine__r.SBQQ__UpgradedSubscription__r.SBQQ__EndDate__c) {
                            s.QuotingStatus__c = 'Extended';
                            subList.add(s);
                            i++;
                        } else if (s.SBQQ__Quantity__c != s.SBQQ__QuoteLine__r.SBQQ__UpgradedSubscription__r.SBQQ__Quantity__c) {
                            s.QuotingStatus__c = 'QuantityChange';
                            subList.add(s);
                            i++;
                        }
                    } else {
                        String contractProdKey = s.SBQQ__Contract__c + '-' + s.SBQQ__Product__c;
                        if (contractProdBySubscription.containsKey(contractProdKey) && s.SBQQ__EndDate__c > contractProdBySubscription.get(contractProdKey).SBQQ__EndDate__c) {
                            system.debug('s.Id extended: ' + s.Id);
                            s.QuotingStatus__c = 'Extended';
                            subList.add(s);
                            i++;
                        } else if (
                            contractProdBySubscription.containsKey(contractProdKey) && s.SBQQ__Quantity__c != contractProdBySubscription.get(contractProdKey).SBQQ__Quantity__c
                        ) {
                            system.debug('s.Id QuantityChange: ' + s.Id);
                            s.QuotingStatus__c = 'QuantityChange';
                            subList.add(s);
                            i++;
                        }
                    }
                }
            }
        }
        if (subList.size() > 0) {
            update subList;
        }
    }
}

/*new SBATRLegacyDataUpdate().populateRelatedSubscriptionsData(String startDate, String endDate, 'Renewal');
new SBATRLegacyDataUpdate().populateSubcriptionFieldsDataNew(String startDate, String endDate, 'Renewal');
new SBATRLegacyDataUpdate().populateQuotingStatusForSubRenewal(5);
new SBATRLegacyDataUpdate().populateQuotingStatusForSubAmendment(5);*/