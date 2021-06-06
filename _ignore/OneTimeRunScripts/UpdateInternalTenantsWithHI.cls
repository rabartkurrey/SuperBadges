public class UpdateInternalTenantsWithHI {
   public void run() {
List<String> entGrpIds = new List<String>{'bbe8ebe5-a9d1-d740-8555-b8774a7c72cd','65e9e4c8-aa01-ac3e-d205-8c2eaf168947','742f226d-de65-b08f-bf1b-275e5500c0b2'};
    Product2 prod = [SELECT Id, ProductCode, Name FROM Product2 where productcode like'%PAN-XDR-HOST-INST%' LIMIT 1];
String hiProductId = prod.Id;      
List<Entitlement> entitlements = [SELECT Id,AccountId,Entitlement_Id__c,Channel_Platform__c,Is_Trial__c,Subscription_Status__c,Entitlement_Group_Id__c,
                                  Serial_Number__c,Tenant_Id__c,Transaction_Type__c,Instance_Url__c,cc_Order__c,Sales_Order__c,support_type__c,ASC__c,
                                  Related_Entitlement__c,CC_Subscription__c,Effective_Date__c,StartDate,EndDate,CSP_ID__c,Product1__c,Parent_Entitlement__c,
                                  Product_Type__c,Name,Primary_Product__c,Product_Links__c,Workloads__c,Subscription__r.SBQQ__Contract__c, 
                                  Licensing_Features__c,Product_Configuration__c,Opportunity__c,Eval_Request__c,Entitlement_JSON__c,Subscription__c,Unique_Entitlement__c
                                  FROM Entitlement WHERE Product1__r.ProductCode ='PAN-XDR-ADV-EP' AND Entitlement_Group_Id__c =:entGrpIds AND Status = 'Active' and Channel_Platform__c='Internal'];

List<Entitlement> hiEntitlements = new List<Entitlement>();
for (Entitlement ent : entitlements) {
    Entitlement clonedEntitlement = ent.clone(false, true, false, false);
    clonedEntitlement.Product1__c = hiProductId;
    clonedEntitlement.Entitlement_Id__c = GuidUtils.getGUID();
    clonedEntitlement.Unique_Entitlement__c = null;
    clonedEntitlement.Primary_Product__c = false;
    clonedEntitlement.Product_Type__c = 'Add-on';
    clonedEntitlement.name =  'Internal-' + prod.ProductCode + ' - ' + String.valueOf(System.now());  
    System.debug('cloned ent ' + clonedEntitlement);
    hiEntitlements.add(clonedEntitlement);
}
if (!hiEntitlements.isEmpty()) {
    insert hiEntitlements;
}

}
}