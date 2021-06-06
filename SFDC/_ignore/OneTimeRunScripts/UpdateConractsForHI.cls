public class UpdateConractsForHI {
   public void run() {
	
     }
     
       //Add HostInsights to Existing Contracts
       public static void addHostInsightsContracts(String hiProductId,String contractId, Integer recordLimit){
               
               Product2 prod = [SELECT Id, ProductCode FROM Product2 where productcode like'%PAN-XDR-HOST-INST%' LIMIT 1];
               String hiProductId = prod.Id;   
               Set<Id> contractIds = new Set<Id>();
               Set<Id> accountIds = new Set<Id>();
               List<Entitlement> hstInstEnt = new List<Entitlement>();
               List<SBQQ__Subscription__c> nwHISubscriptionLst = new List<SBQQ__Subscription__c>(); 
               Map<String,SBQQ__Subscription__c> contractSubscriptionMap = new Map<String,SBQQ__Subscription__c>();
               Decimal quantity = 0;
               String serialNumber = '';
               String tenantId ='';
               Decimal unitPrice = 0.0;
               List<SBQQ__Subscription__c> subLst = [SELECT Id,SBQQ__Contract__c,SBQQ__Product__r.ProductCode,SBQQ__Quantity__c,SBQQ__Account__c,Serial_Number__c,Tenant_Id__c,SBQQ__StartDate__c,SBQQ__EndDate__c,SBQQ__Contract__r.Exclude_From__c FROM SBQQ__Subscription__c 
                                                     WHERE (SBQQ__Product__r.ProductCode LIKE '%ADV-EP%' OR SBQQ__Product__r.ProductCode LIKE '%NOCDL%') AND OffBoarded__c = false AND CreatedDate < 2020-10-01T23:59:59.000+0000 AND (NOT SBQQ__Contract__r.Exclude_From__c IN ('HI Custom Discounts')) AND SBQQ__Contract__C != NULL LIMIT 200];// AND SBQQ__Contract__c ='8000g000002BVHHAA4'];// LIMIT :recordLimit];//
               if (!subLst.isEmpty()) {
                   for(SBQQ__Subscription__c s: subLst){
                       if(s.SBQQ__Contract__r.Exclude_From__c == null || !s.SBQQ__Contract__r.Exclude_From__c.containsIgnoreCase('HI Custom Discounts')){
                           contractIds.add(s.SBQQ__Contract__c);
                       }
                   }
                   if (!contractIds.isEmpty()) {
                       List<Contract> contractLst = [SELECT Id,Exclude_From__c,AccountId,StartDate,EndDate,SBQQ__Order__c,Account.Theatre__c 
                                                     FROM Contract WHERE Id IN:contractIds];
                       System.debug('SBDataUpdatesJobHelper:addHostInsightsContracts:contractLst' + contractLst);
                       
                       If(contractLst.size()> 0){
                           
                           List<SBQQ__Subscription__c> subscriptionLst = [SELECT Id,SBQQ__Contract__c,SBQQ__Product__r.ProductCode,SBQQ__Quantity__c,Serial_Number__c,Tenant_Id__c,SBQQ__Account__c,SBQQ__StartDate__c,SBQQ__EndDate__c FROM SBQQ__Subscription__c 
                                                                          WHERE (SBQQ__Product__r.ProductCode LIKE '%ADV-EP%' OR SBQQ__Product__r.ProductCode LIKE '%NOCDL%') AND SBQQ__Contract__c IN: contractLst AND OffBoarded__c = false];// AND SBQQ__Contract__c = '8000m000000ykpiAAA'];
                           for(Contract c: contractLst){
                               if(c.Exclude_From__c != null){
                                   c.Exclude_From__c = c.Exclude_From__c +';'+'HI Custom Discounts';
                               }else{
                                   c.Exclude_From__c ='HI Custom Discounts';
                               }
                               
                               accountIds.add(c.AccountId);
                           }
                           List<Entitlement> entitlementLst = [SELECT Id,AccountId,Entitlement_Id__c,Channel_Platform__c,Is_Trial__c,Subscription_Status__c,Entitlement_Group_Id__c,
                                                               Serial_Number__c,Tenant_Id__c,Transaction_Type__c,Instance_Url__c,cc_Order__c,Sales_Order__c,support_type__c,ASC__c,
                                                               Related_Entitlement__c,CC_Subscription__c,Effective_Date__c,StartDate,EndDate,CSP_ID__c,Product1__c,Parent_Entitlement__c,
                                                               Product_Type__c,Name,Primary_Product__c,Product_Links__c,Workloads__c,Subscription__r.SBQQ__Contract__c, 
                                                               Licensing_Features__c,Product_Configuration__c,Opportunity__c,Eval_Request__c,Entitlement_JSON__c,Subscription__c,Unique_Entitlement__c
                                                               FROM Entitlement WHERE AccountId IN:accountIds 
                                                               AND (Product1__r.ProductCode LIKE '%ADV-EP%' OR Product1__r.ProductCode LIKE '%NOCDL%') AND Status = 'Active' Order By AccountId DESC];
                           
                           
                           for(Contract c: contractLst){
                               quantity = 0;
                               String acctTheatre = c.Account.Theatre__c;
                               if (!String.isBlank(acctTheatre) && acctTheatre.equalsIgnoreCase('NAM')) {
                                   unitPrice = 30.00;
                               } else {
                                   unitPrice = 35.00;
                               }
                               
                               for(SBQQ__Subscription__c s: subscriptionLst){
                                   if(s.SBQQ__Contract__c == c.Id){
                                       if(s.SBQQ__Product__r.ProductCode.containsIgnoreCase('NOCDL')){
                                           quantity = quantity+ s.SBQQ__Quantity__c*200;
                                       } else{
                                           quantity = quantity+ s.SBQQ__Quantity__c;
                                       }
                                       serialNumber = s.Serial_Number__c;
                                       tenantId = s.Tenant_Id__c;
                                   }
                               }
                               //To calculate Correct term from given dates
                               Decimal subscriptionTerm = c.StartDate.monthsBetween(c.EndDate);
                               if (c.EndDate.day() > c.StartDate.day()) {
                                   subscriptionTerm++;
                               }
                               
                               SBQQ__Subscription__c sub = new SBQQ__Subscription__c();
                               sub.SBQQ__Contract__c = c.Id;
                               sub.SBQQ__ChargeType__c = 'One-time';
                               sub.SBQQ__ProductSubscriptionType__c = 'Renewable';
                               sub.SBQQ__SubscriptionType__c = 'Renewable';
                               sub.SBQQ__Discount__c = 100;
                               sub.Total_Discount__c = 100;
                               sub.SBQQ__PricingMethod__c = 'List';
                               sub.SBQQ__Account__c = c.AccountId;
                               sub.SBQQ__Product__c = hiProductId;
                               sub.SBQQ__Number__c = 2;
                               sub.SBQQ__Quantity__c = quantity;
                               sub.SBQQ__RenewalQuantity__c = quantity;
                               sub.SBQQ__SubscriptionStartDate__c = c.StartDate;
                               sub.SBQQ__SubscriptionEndDate__c = c.EndDate;
                               
                               sub.SBQQ__ListPrice__c = unitPrice;
                               sub.SBQQ__NetPrice__c = 0;
                               sub.SBQQ__ProrateMultiplier__c = subscriptionTerm / 12;
                               System.debug('SBDataUpdatesJobHelper:createSubscriptions:renewOppId' + subscriptionTerm / 12);
                               System.debug('SBDataUpdatesJobHelper:createSubscriptions:SBQQ__ProrateMultiplier__c' + sub.SBQQ__ProrateMultiplier__c);
                               sub.SBQQ__RenewalPrice__c = unitPrice;
                               sub.SBQQ__CustomerPrice__c = unitPrice;
                               sub.SBQQ__RegularPrice__c = unitPrice;
                               sub.SBQQ__SpecialPrice__c = unitPrice;
                               sub.Serial_Number__c = serialNumber;
                               sub.Tenant_Id__c = tenantId;
                               nwHISubscriptionLst.add(sub);            
                           }  
                           System.debug('SBDataUpdatesJobHelper:createSubscriptions:nwHISubscriptionLst' + nwHISubscriptionLst);
                           If(nwHISubscriptionLst.size() > 0){
                               insert nwHISubscriptionLst;
                           }
                           System.debug('SBDataUpdatesJobHelper:createSubscriptions:nwHISubscriptionLst' + nwHISubscriptionLst);
                           for(SBQQ__Subscription__c sb: nwHISubscriptionLst){
                               for(Entitlement en : entitlementLst){
                                   if(sb.SBQQ__Account__c == en.AccountId && sb.Serial_Number__c == en.Serial_Number__c){
                                       System.debug('SBDataUpdatesJobHelper:createSubscriptions:sb.SBQQ__Contract__c' + sb.SBQQ__Contract__c);
                                       System.debug('SBDataUpdatesJobHelper:createSubscriptions:en.Unique_Entitlement__c ' + en.Unique_Entitlement__c );
                                       Entitlement clonedEntitlement = en.clone(false, true, false, false);
                                       clonedEntitlement.StartDate = sb.SBQQ__SubscriptionStartDate__c;
                                       clonedEntitlement.EndDate = sb.SBQQ__SubscriptionEndDate__c;
                                       clonedEntitlement.Product1__c = hiProductId;
                                       clonedEntitlement.Entitlement_Id__c = GuidUtils.getGUID();
                                       clonedEntitlement.Subscription__c = sb.Id;
                                       clonedEntitlement.Opportunity__c = null;
                                       clonedEntitlement.Eval_Request__c = null;
                                       clonedEntitlement.Tenant_Id__c = sb.Tenant_Id__c;
                                       clonedEntitlement.Serial_Number__c = sb.Serial_Number__c;
                                       clonedEntitlement.Channel_Platform__c = 'Migration';
                                       clonedEntitlement.Unique_Entitlement__c += clonedEntitlement.Entitlement_Id__c+sb.SBQQ__Contract__c;
                                       System.debug('SBDataUpdatesJobHelper:createSubscriptions:clonedEntitlement.Unique_Entitlement__c ' + clonedEntitlement.Unique_Entitlement__c );
                                       clonedEntitlement.name= 'Migration - Host Insights - '+String.valueOf(System.now());  
                                       clonedEntitlement.Licensing_Features__c ='[{"unit_of_measure":"Endpoint","quantity":'+sb.SBQQ__Quantity__c+'}]';
                                       hstInstEnt.add(clonedEntitlement);
                                       break;
                                   }
                               }
                           }
                       }
                       
                       If(hstInstEnt.size() > 0){
                           insert hstInstEnt;
                       }
                       If(contractLst.size() > 0){
                           update contractLst;
                       }
                       
                   }
               }
               
    }
         
         //Insert Host Insight Opportunity LineItems
         public static void updateRenewalOpportunity(){
             List<OpportunityLineItem> oLineItemLst = new List<OpportunityLineItem>();  
             Set<Id> renewOppIds = new Set<Id>();
             List<SBQQ__Subscription__c> nwHISubLst =[SELECT Id,SBQQ__Product__c,SBQQ__Contract__r.SBQQ__RenewalOpportunity__c,SBQQ__Quantity__c,SBQQ__ListPrice__c,SBQQ__Contract__r.SBQQ__OpportunityPricebookId__c 
                                                      FROM SBQQ__Subscription__c WHERE SBQQ__Product__r.ProductCode ='PAN-XDR-HOST-INST' AND SBQQ__Contract__r.SBQQ__RenewalOpportunity__c != NULL AND SBQQ__Contract__r.SBQQ__RenewalOpportunity__r.StageName != '10 - Closed - Won' LIMIT 100];
             for(SBQQ__Subscription__c sb: nwHISubLst){
                 renewOppIds.add(sb.SBQQ__Contract__r.SBQQ__RenewalOpportunity__c);
             }
             Map<String,OpportunityLineItem> oppLineItemMap = new Map<String,OpportunityLineItem>([SELECT OpportunityId FROM OpportunityLineItem WHERE Product2.ProductCode ='PAN-XDR-HOST-INST' AND OpportunityId IN: renewOppIds]);
             System.debug('MktpCPQMigrationHelper:updateRenewalOpportunity'+oppLineItemMap.size());
             for(SBQQ__Subscription__c sb: nwHISubLst){
                 OpportunityLineItem oItem = oppLineItemMap.get(sb.SBQQ__Contract__r.SBQQ__RenewalOpportunity__c);
                 If(oItem == null){
                     OpportunityLineItem oI = new OpportunityLineItem();
                     oI.Product2Id = sb.SBQQ__Product__c;
                     oI.Product_Family__c = 'XDR';
                     oI.OpportunityId = sb.SBQQ__Contract__r.SBQQ__RenewalOpportunity__c;
                     oI.Quantity = sb.SBQQ__Quantity__c;
                     oI.TotalPrice = sb.SBQQ__Quantity__c * sb.SBQQ__ListPrice__c;  
                     oLineItemLst.add(oI); 
                 }
             }
             System.debug('MktpCPQMigrationHelper:updateRenewalOpportunity:oLineItemLst'+oLineItemLst.size());
             If(oLineItemLst.size() > 0){
                 Database.SaveResult[] lsr =  Database.insert(oLineItemLst,false);
                 for(Integer i=0;i<lsr.size();i++){
                     if(!lsr[i].isSuccess()){//only look at failures, or NOT Successes
                         system.debug(lsr[i].getErrors());                   
                     }
                 }
                 
             }
             
    }
}