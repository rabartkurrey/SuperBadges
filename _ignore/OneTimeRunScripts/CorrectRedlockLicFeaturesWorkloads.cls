public class CorrectRedlockLicenseFeatures{
    public void updateLicenseFeaturesWorkloads(Integer lmt){
        List<Entitlement> entlist = [SELECT id, sales_order__c,Entitlement_Group_Id__c,Workloads__c, Serial_Number__c,Product1__r.QuantityUnitOfMeasure, 
                             Product1__r.ProductCode,Instance_Url__c, Product1__r.Product_Group__c, Licensing_Features__c 
                             FROM Entitlement WHERE Product1__r.Product_Group__c ='RedLock'];
        List<Entitlement> eList = new List<Entitlement>();
        integer i = 0;
        for(Entitlement e : entList) {
            Boolean entUpdated = false;
            system.debug('licensed Features: '+e.Licensing_Features__c);
            if(String.isNotBlank(e.Licensing_Features__c) && !e.Licensing_Features__c.containsIgnoreCase('unit_of_measure') && e.Licensing_Features__c.containsIgnoreCase('workloads')) {
                System.debug('entitlement id: '+e.Id);
                System.debug('licensed Features: '+e.Licensing_Features__c);
                List<Object> listFeatures = (List<Object>) JSON.deserializeUntyped(e.Licensing_Features__c);
                Map<String, Object> licObj = (Map<String, Object>) listFeatures[0];
                system.debug('prodlicensesFeatures'+licObj.get('workloads'));
                Integer quantity = Integer.valueOf(licObj.get('workloads'));
                e.Licensing_Features__c = '[{"unit_of_measure": "'+e.Product1__r.QuantityUnitOfMeasure+'","quantity":' + quantity + '}]';
                entUpdated = true;
                system.debug('License Features after: '+e.Licensing_Features__c);
            }  
            if(String.isNotBlank(e.Licensing_Features__c) && e.Workloads__c == null) {
                System.debug('e.Id: '+e.Id);
                List<Object> listFeatures = (List<Object>) JSON.deserializeUntyped(e.Licensing_Features__c);
                Map<String, Object> licObj = (Map<String, Object>) listFeatures[0];
                Integer quantity = Integer.valueOf(licObj.get('quantity'));
                e.Workloads__c = quantity;
                entUpdated = true;
            }
            if(entUpdated) {
                eList.add(e);
                i++;
            }
            if(i >= lmt) {
              break; }
        }
        if(!elist.isEmpty()) {
            Database.update(elist,false);
        }
    }
}
new CorrectRedlockLicenseFeatures().updateLicenseFeaturesWorkloads(5);