public class CorrectTwistLockLicenseFeatures{
    //FOR HOSTS products
    public void updateLicensedHost(Integer lmt){
        List<entitlement> entlist = [select id, sales_order__c,Entitlement_Group_Id__c, Serial_Number__c,Product1__r.QuantityUnitOfMeasure, 
                             Product1__r.ProductCode,Instance_Url__c, Product1__r.Product_Group__c, Licensing_Features__c 
                             from entitlement where Product1__r.Product_Group__c ='TwistLock' and Primary_Product__c=true 
                             and Product1__r.QuantityUnitOfMeasure = 'HOST'];
        list<entitlement> elist = new List<entitlement>();
        integer i = 0;
        for(Entitlement e : entList) {
            
            system.debug('licensed Features: '+e.Licensing_Features__c);
            //FOR HOSTS products with licensedhosts
            if(String.isNotBlank(e.Licensing_Features__c) && e.Licensing_Features__c.containsIgnoreCase('licensedHosts') && i < lmt) {
                system.debug('entitlement id: '+e.Id);
                system.debug('licensed Features: '+e.Licensing_Features__c);
                List<Object> listFeatures = (List<Object>) JSON.deserializeUntyped(e.Licensing_Features__c);
                Map<String, Object> licObj = (Map<String, Object>) listFeatures[0];
                system.debug('prodlicensesFeatures'+licObj.get('licensedHosts'));
                Integer quantity = Integer.valueOf(licObj.get('licensedHosts'));
                e.Licensing_Features__c = '[{"unit_of_measure": "'+e.Product1__r.QuantityUnitOfMeasure+'","quantity":' + quantity + '}]';
                elist.add(e);
                i++;
            }  
        }
        if(!elist.isEmpty()) {
            update elist;
        }
    }

    //FOR HOST products License Feature has workloads
    public void hostPrdWithWorkloadLF(Integer lmt){
        List<entitlement> entlist = [select id, sales_order__c,Entitlement_Group_Id__c, Serial_Number__c,Product1__r.QuantityUnitOfMeasure, 
                             Product1__r.ProductCode,Instance_Url__c, Product1__r.Product_Group__c, Licensing_Features__c 
                             from entitlement where Product1__r.Product_Group__c ='TwistLock' and Primary_Product__c=true 
                             and Product1__r.QuantityUnitOfMeasure = 'HOST'];
        list<entitlement> elist = new List<entitlement>();
        Integer i = 0;
        for(Entitlement e : entList) {
            system.debug('licensed Features: '+e.Licensing_Features__c);
            if(String.isNotBlank(e.Licensing_Features__c) && !e.Licensing_Features__c.containsIgnoreCase('unit_of_measure') && e.Licensing_Features__c.containsIgnoreCase('workloads') && i < lmt) {
                system.debug('entitlement id: '+e.Id);
                system.debug('licensed Features: '+e.Licensing_Features__c);
                List<Object> listFeatures = (List<Object>) JSON.deserializeUntyped(e.Licensing_Features__c);
                Map<String, Object> licObj = (Map<String, Object>) listFeatures[0];
                system.debug('prodlicensesFeatures'+licObj.get('workloads'));
                Integer quantity = Integer.valueOf(licObj.get('workloads'));
                e.Licensing_Features__c = '[{"unit_of_measure": "'+e.Product1__r.QuantityUnitOfMeasure+'","quantity":' + quantity + '}]';
                elist.add(e);
                i++;
            }
        }
        if(!elist.isEmpty()) {
            update elist;
        }
    }

    //FOR WORKLOADS products
    public void workloadPrdWithWrongFormat(Integer lmt){
        List<entitlement> entlist = [select id, sales_order__c,Entitlement_Group_Id__c, Serial_Number__c,Product1__r.QuantityUnitOfMeasure, 
                             Product1__r.ProductCode,Instance_Url__c, Product1__r.Product_Group__c, Licensing_Features__c 
                             from entitlement where Product1__r.Product_Group__c ='TwistLock' and Primary_Product__c=true 
                             and Product1__r.QuantityUnitOfMeasure = 'workloads'];
        list<entitlement> elist = new List<entitlement>();
        Integer i = 0;
        for(Entitlement e : entList) {
            system.debug('licensed Features: '+e.Licensing_Features__c);
            if(String.isNotBlank(e.Licensing_Features__c) && !e.Licensing_Features__c.containsIgnoreCase('unit_of_measure') && e.Licensing_Features__c.containsIgnoreCase('workloads') && i < lmt) {
                system.debug('entitlement id: '+e.Id);
                system.debug('licensed Features: '+e.Licensing_Features__c);
                List<Object> listFeatures = (List<Object>) JSON.deserializeUntyped(e.Licensing_Features__c);
                Map<String, Object> licObj = (Map<String, Object>) listFeatures[0];
                system.debug('prodlicensesFeatures'+licObj.get('workloads'));
                Integer quantity = Integer.valueOf(licObj.get('workloads'));
                e.Licensing_Features__c = '[{"unit_of_measure": "'+e.Product1__r.QuantityUnitOfMeasure+'","quantity":' + quantity + '}]';
                elist.add(e);
                i++;
            }
        }
        if(!elist.isEmpty()) {
            update elist;
        }
    }

    //FOR Twistlock all products only quantity
    public void allTwistLockPrdWithOnlyQty(Integer lmt){
        List<entitlement> entlist = [select id, sales_order__c,Entitlement_Group_Id__c, Serial_Number__c, Product1__r.QuantityUnitOfMeasure,
                             Product1__r.ProductCode,Instance_Url__c, Product1__r.Product_Group__c, Licensing_Features__c 
                             from entitlement where Product1__r.Product_Group__c ='TwistLock' and Primary_Product__c=true];
        list<entitlement> elist = new List<entitlement>();
        Integer i = 0;
        for(Entitlement e : entList) {
            system.debug('licensed Features: '+e.Licensing_Features__c);
            if(String.isNotBlank(e.Licensing_Features__c) && !e.Licensing_Features__c.containsIgnoreCase('unit_of_measure') && 
                !e.Licensing_Features__c.containsIgnoreCase('workloads') && !e.Licensing_Features__c.containsIgnoreCase('licensedHosts') && i<lmt) {
                system.debug('entitlement id: '+e.Id);
                system.debug('licensed Features: '+e.Licensing_Features__c);
                List<Object> listFeatures = (List<Object>) JSON.deserializeUntyped(e.Licensing_Features__c);
                Map<String, Object> licObj = (Map<String, Object>) listFeatures[0];
                system.debug('prodlicensesFeatures'+licObj.get('quantity'));
                Integer quantity = Integer.valueOf(licObj.get('quantity'));
                e.Licensing_Features__c = '[{"unit_of_measure": "'+e.Product1__r.QuantityUnitOfMeasure+'","quantity":' + quantity + '}]';
                elist.add(e);
                i++;
            }
        }
        if(!elist.isEmpty()) {
            update elist;
        }
    }
    
}
new CorrectTwistLockLicenseFeatures().updateLicensedHost(5);
new CorrectTwistLockLicenseFeatures().hostPrdWithWorkloadLF(5);
new CorrectTwistLockLicenseFeatures().workloadPrdWithWrongFormat(5);
new CorrectTwistLockLicenseFeatures().allTwistLockPrdWithOnlyQty(5);