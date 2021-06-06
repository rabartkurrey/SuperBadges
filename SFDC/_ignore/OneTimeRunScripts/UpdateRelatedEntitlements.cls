public class UpdateRelatedEntitlements {
   public void run() {
	List<Entitlement> entitlements = new List<Entitlement>();
        /*Migrated Contracts - Subscription__c != null*/
        //entitlements = [SELECT Id,Name, StartDate, EndDate,Product1__c, Product1__r.ProductCode, Related_Entitlement__c, Related_Entitlement__r.Name, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.ProductCode = :SBProductHelper.LGS_PRODUCT_MAP.values() AND Product1__r.Nova_Products__c = TRUE AND Related_Entitlement__c!=null AND Subscription__c != null];

        /*Net New  - Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Quote'*/
        //entitlements = [SELECT Id,Name, StartDate, EndDate,Product1__c, Product1__r.ProductCode, Related_Entitlement__c, Related_Entitlement__r.Name, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.ProductCode = :SBProductHelper.LGS_PRODUCT_MAP.values() AND Product1__r.Nova_Products__c = TRUE AND Related_Entitlement__c!=null AND Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Quote'];

        /*Amend  - Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Amendment'*/
        //entitlements = [SELECT Id,Name, StartDate, EndDate,Product1__c, Product1__r.ProductCode, Related_Entitlement__c, Related_Entitlement__r.Name, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.ProductCode = :SBProductHelper.LGS_PRODUCT_MAP.values() AND Product1__r.Nova_Products__c = TRUE AND Related_Entitlement__c!=null AND Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Amendment'];

        /*Renewal - Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Renewal'*/
        //entitlements = [SELECT Id,Name, StartDate, EndDate,Product1__c, Product1__r.ProductCode, Related_Entitlement__c, Related_Entitlement__r.Name, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.ProductCode = :SBProductHelper.LGS_PRODUCT_MAP.values() AND Product1__r.Nova_Products__c = TRUE AND Related_Entitlement__c!=null AND Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Renewal'];

        /*Evals - (Is_Trial__c =true AND Sales_Order__c =null AND Subscription__c =null)*/
        //entitlements = [SELECT Id,Name, StartDate, EndDate,Product1__c, Product1__r.ProductCode, Related_Entitlement__c, Related_Entitlement__r.Name, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.ProductCode = :SBProductHelper.LGS_PRODUCT_MAP.values() AND Product1__r.Nova_Products__c = TRUE AND Related_Entitlement__c!=null AND (Is_Trial__c =true AND Sales_Order__c =null AND Subscription__c =null)];

        /*Internal Trials - Name LIKE 'Internal%'*/
//        entitlements = [SELECT Id,Name, StartDate, EndDate,Product1__c, Product1__r.ProductCode, Related_Entitlement__c, Related_Entitlement__r.Name, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.ProductCode = :SBProductHelper.LGS_PRODUCT_MAP.values() AND Product1__r.Nova_Products__c = TRUE AND Related_Entitlement__c!=null AND (Name LIKE 'Internal%')];

        System.debug('LGS Entitlement size ' + entitlements.size());
        if (!entitlements.isEmpty()) {
            List<Entitlement> finalEntitlements = new List<Entitlement>();
            Map<String, Entitlement> lgsEntMap = new Map<String, Entitlement>();
            Set<String> entGroupIds = new Set<String>();
            for (Entitlement entitlement : entitlements) {
                System.debug(entitlement.Entitlement_Group_Id__c);
                lgsEntMap.put(entitlement.Entitlement_Group_Id__c, entitlement);
                entGroupIds.add(entitlement.Entitlement_Group_Id__c);
            }
            List<Entitlement> xdrEntitlements =  new List<Entitlement>();
            /*Migrated Contracts - Subscription__c != null*/
            //xdrEntitlements = [SELECT Id, Related_Entitlement__c, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.Nova_Products__c = TRUE AND Product1__r.ProductCode != :SBProductHelper.LGS_PRODUCT_MAP.values() AND Related_Entitlement__c = NULL AND Entitlement_Group_Id__c =:entGroupIds AND Subscription__c != null];

            /*Net New  - Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Quote'*/
            //xdrEntitlements = [SELECT Id, Related_Entitlement__c, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.Nova_Products__c = TRUE AND Product1__r.ProductCode != :SBProductHelper.LGS_PRODUCT_MAP.values() AND Related_Entitlement__c = NULL AND Entitlement_Group_Id__c =:entGroupIds AND Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Quote'];

            /*Amend  - Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Amendment'*/
            //xdrEntitlements = [SELECT Id, Related_Entitlement__c, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.Nova_Products__c = TRUE AND Product1__r.ProductCode != :SBProductHelper.LGS_PRODUCT_MAP.values() AND Related_Entitlement__c = NULL AND Entitlement_Group_Id__c =:entGroupIds AND Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Amendment'];

            /*Renewal - Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Renewal'*/
            //xdrEntitlements = [SELECT Id, Related_Entitlement__c, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.Nova_Products__c = TRUE AND Product1__r.ProductCode != :SBProductHelper.LGS_PRODUCT_MAP.values() AND Related_Entitlement__c = NULL AND Entitlement_Group_Id__c =:entGroupIds AND Sales_Order__r.SBQQ__Quote__r.SBQQ__Type__c ='Renewal'];

            /*Evals - (Is_Trial__c =true AND Sales_Order__c =null AND Subscription__c =null)*/
            //xdrEntitlements = [SELECT Id, Related_Entitlement__c, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.Nova_Products__c = TRUE AND Product1__r.ProductCode != :SBProductHelper.LGS_PRODUCT_MAP.values() AND Related_Entitlement__c = NULL AND Entitlement_Group_Id__c =:entGroupIds AND (Is_Trial__c =true AND Sales_Order__c =null AND Subscription__c =null)];

            /*Internal Trials - Name LIKE 'Internal%'*/
//            xdrEntitlements = [SELECT Id, Related_Entitlement__c, Entitlement_Group_Id__c FROM Entitlement WHERE Product1__r.Product_Group__c LIKE 'XDR%' AND Product1__r.Nova_Products__c = TRUE AND Product1__r.ProductCode != :SBProductHelper.LGS_PRODUCT_MAP.values() AND Related_Entitlement__c = NULL AND Entitlement_Group_Id__c =:entGroupIds AND Name LIKE 'Internal%'];
            System.debug('XDR Entitlement size ' + xdrEntitlements.size());
            Map<String, List<Entitlement>> xdrMap = new Map<String, List<Entitlement>>();
            for (Entitlement xdrEntitlement : xdrEntitlements) {
                String key = xdrEntitlement.Entitlement_Group_Id__c;
                if (null == xdrMap.get(key)) {
                    xdrMap.put(key, new List<Entitlement>());
                }
                xdrMap.get(key).add(xdrEntitlement);
            }

            for (String key : xdrMap.keySet()) {
                Entitlement lgsEnt = lgsEntMap.get(key);

                lgsEnt.Related_Entitlement__c = null;
                finalEntitlements.add(lgsEnt);
                for (Entitlement xdrEnt : xdrMap.get(key)) {
                    xdrEnt.Related_Entitlement__c = lgsEnt.Id;
                    finalEntitlements.add(xdrEnt);
                }
            }
            System.debug('lgs entitlements ' + lgsEntMap.size());
            System.debug('final entitlements ' + finalEntitlements.size());
            if (!finalEntitlements.isEmpty()) {
                //update finalEntitlements;
            }
        }
     }
}