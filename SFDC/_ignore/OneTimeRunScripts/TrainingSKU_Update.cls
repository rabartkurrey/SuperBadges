/**
 * @File Name          : TrainingSKU_Update.cls
 * @Description        : This script is used to Update Training SKU
 * @Author             : Sagar Tumma
 * @Group              : 
 * @Last Modified By   : Sagar Tumma
 * @Last Modified On   : 11/09/2020 
 * @Modification Log   : 
 * Ver       Date            Author      		    Modification
 * 1.0    11/09/2020       Sagar Tumma              Initial Version
 *
 * RUN THE SCRIPT ONCE FOR UPDATING Training SKU AS PER NOVACPQ-1248 & NOVACPQ-1265
 *
**/

public class TrainingSKU_Update{
    public void run(){
        
        List<Product2> prdList = new List<Product2>();
        List<Pricebook2> pbList = new List<Pricebook2>();
        List<blng__BillingRule__c> billingRuleList = new List<blng__BillingRule__c>();
        List<blng__TaxRule__c> taxRuleList = new List<blng__TaxRule__c>();
        List<blng__RevenueRecognitionRule__c> revRecRuleList = new List<blng__RevenueRecognitionRule__c>();
        List<PricebookEntry> pbeInsertList= new List<PricebookEntry>();
        
        pbList = [SELECT Id, Name FROM Pricebook2 WHERE Name 
                  IN ('Palo Alto Networks Marketplace International Price Book','Palo Alto Networks MarketPlace Price Book')];
        System.debug('***pbList   '+pbList.size());
        
        billingRuleList = [SELECT Id FROM blng__BillingRule__c WHERE  Name = 'Combine Partial Periods'];
        taxRuleList  = [SELECT Id FROM blng__TaxRule__c WHERE  Name = 'Default Tax Rule'];
        revRecRuleList = [SELECT Id FROM blng__RevenueRecognitionRule__c WHERE  Name = 'Invoice Based.Full Recognition'];
        System.debug('***billingRuleList   '+billingRuleList.size());
        System.debug('***taxRuleList   '+taxRuleList.size());
        System.debug('***revRecRuleList   '+revRecRuleList.size());
        
        prdList = [SELECT Id, ProductCode, Family, Product_Filter__c, Type_Of_Product__c, Professional_Services_Required__c,
                   QLE_Lock_Fields__c, SBQQ__SortOrder__c, Entitlement_Product_Code__c, Internal_SKU_Name__c,Approval_Category__c,
                   Main_Speedboat_Type__c,nova_products__c,Product_Type__c,Type_Of_Quantity__c,SBQQ__QuantityScale__c, 
                   SAP_Material_Name__c,SAP_Material_Number__c,PS_Type__c,Exclude_From__c,blng__BillingRule__c,blng__TaxRule__c,
                   blng__RevenueRecognitionRule__c,Enable_CPQ_Features__c
                   FROM Product2 
                   WHERE ProductCode IN ('PAN-EDU-TRAINING-100')];
        
        System.debug('***PrdList   '+prdList.size());
        if(!prdList.isEmpty()){
            for(Product2 echPrdRec: prdList){
                if(!pbList.isEmpty()){
                    for(Pricebook2 eachPbRec: pbList){
                        PricebookEntry newPbe = new PricebookEntry();
                        newPbe.Product2Id = echPrdRec.Id;
                        newPbe.Pricebook2Id = eachPbRec.Id;
                        newPbe.UnitPrice = 100;
                        newPbe.IsActive = true;
                        pbeInsertList.add(newPbe);
                    }
                }
                
                
                if(echPrdRec.ProductCode == 'PAN-EDU-TRAINING-100'){
                    //echPrdRec.Family = 'Professional Services';
                    echPrdRec.nova_products__c = true;
                    echPrdRec.SAP_Material_Name__c = 'EDUTRAINING100';
                    echPrdRec.SAP_Material_Number__c = 'EDUTRAINING100';
                    echPrdRec.Product_Filter__c = 'Professional Services';
                    echPrdRec.Internal_SKU_Name__c = 'PAN-EDU-TRAINING-100';
                    echPrdRec.QLE_Lock_Fields__c = 'SBQQ__SubscriptionTerm__c,Region__c';       
                    echPrdRec.SBQQ__SortOrder__c = 9040;            
                    echPrdRec.Approval_Category__c = 'E'; 
                    echPrdRec.Main_Speedboat_Type__c = 'Prisma';
                    echPrdRec.Type_Of_Product__c = 'Prisma Public Cloud';
                    echPrdRec.Type_Of_Quantity__c = 'Prisma Workload;Prisma Account;Prisma Host';
                    echPrdRec.SBQQ__QuantityScale__c = 0;
                    echPrdRec.Enable_CPQ_Features__c = 'Show In Prod Selection Page';
                    echPrdRec.blng__BillingRule__c = billingRuleList[0].Id;
                    echPrdRec.blng__TaxRule__c = taxRuleList[0].Id;
                    echPrdRec.blng__RevenueRecognitionRule__c  = revRecRuleList[0].Id;
                    echPrdRec.Exclude_From__c  = ‘Entitlements’;
                    
                }
            }   
            update prdList;
            if(!pbeInsertList.isEmpty()){
                insert pbeInsertList;
            }
        }
        
        System.debug('running');
    }
}
new TrainingSKU_Update().run();