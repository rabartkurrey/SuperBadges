/**
 * Created by rbellamkonda on 3/3/2020.
 */

public with sharing class UpdateMigratedRenewalOpportunities {

    public void run() {
        List<Opportunity> renewOppList = new List<Opportunity>();
        Set<Id> distiIdSet = new Set<Id>();
        Set<Id> resellerIdSet = new Set<Id>();
        Id distiId = null;
        Id resellerId = null;
        Map<Id, Id> oppDistiMap = new Map<Id, Id>();
        Map<Id, Id> oppResellerMap = new Map<Id, Id>();
        List<String> contractIdLst = new List<String>();
        List<Contract> contractList = [SELECT Id,sbqq__renewalopportunity__r.Id,migration_data__r.Disti_id__C,migration_data__r.Reseller_id__C FROM Contract
        where migration_data__c != null AND sbqq__renewalopportunity__c != null AND
        migration_data__r.Create_Renewal_Opportunity__c = false AND migration_data__r.Product_group__c = 'XDR'];
        for (Contract contract : contractList) {
            contractIdLst.add(contract.Id);
        }
        List<Migration_data__c> migDataLst = [SELECT Id,Disti_id__C,Reseller_id__C,Create_Renewal_Opportunity__c FROM Migration_data__c WHERE new_contract_number__c != null
        and new_contract_number__c IN:contractIdLst];
        for (Migration_data__c migrationData : migDataLst) {
            if (migrationData.Disti_id__C != null && migrationData.Disti_id__C.startsWithIgnoreCase('001')) {
                distiIdSet.add(migrationData.Disti_id__c);
            }
            if (migrationData.Reseller_id__C != null && migrationData.Reseller_id__C.startsWithIgnoreCase('001')) {
                resellerIdSet.add(migrationData.Reseller_id__C);
            }
        }
        List<PAN_Distributors__c> distiLst = [SELECT Id,Account_Id__c FROM PAN_Distributors__c WHERE Account_Id__c IN:distiIdSet];
        for (PAN_Distributors__c panDistributors : distiLst) {
            oppDistiMap.put(panDistributors.Account_Id__c, panDistributors.Id);
        }

        List<Account> resellerAcctId = [SELECT Id FROM Account WHERE Id IN:resellerIdSet];
        for (Account account : resellerAcctId) {
            oppResellerMap.put(account.Id, account.Id);
        }
        for (Contract contract : contractList) {
            System.debug('Disti AccountId**' + contract.migration_data__r.Disti_id__C);
            Opportunity oppty = new Opportunity();
            oppty.Id = contract.sbqq__renewalopportunity__r.Id;
            System.debug('oId**' + oppty.Id);
            if (contract.migration_data__r.Disti_id__C != null && contract.migration_data__r.Disti_id__C.startsWithIgnoreCase('001')) {
                // List<PAN_Distributors__c> distiLst =[SELECT iD FROM PAN_Distributors__c WHERE Account_Id__c =:c.migration_data__r.Disti_id__C];
                //  System.debug('distiLst**'+distiLst);
                if (oppDistiMap != null && oppDistiMap.size() > 0) {
                    System.debug('>>>>>>>disti++' + oppDistiMap.get(Id.valueOf(contract.migration_data__r.Disti_id__C)));
                    distiId = oppDistiMap.get(Id.valueOf(contract.migration_data__r.Disti_id__C));
                }
                System.debug('disti Id***' + distiId);
                if (distiId != null) {
                    oppty.Distributor__c = distiId;
                }
            }
            if (contract.migration_data__r.Reseller_id__C != null && contract.migration_data__r.Reseller_id__C.startsWithIgnoreCase('001')) {
                if (oppResellerMap != null && oppResellerMap.size() > 0) {
                    resellerId = oppResellerMap.get(Id.valueOf(contract.migration_data__r.Reseller_id__C));
                    if (resellerId != null) {
                        oppty.Second_Tier_Reseller__c = resellerId;
                    }
                }
                System.debug('&&&&' + contract.migration_data__r.Reseller_id__C);
            }
            if (oppty.Second_Tier_Reseller__c != null && oppty.Distributor__c != null) {
                renewOppList.add(oppty);
            }
        }
        if (renewOppList.size() > 0) {
            update renewOppList;
        }
        for (Migration_Data__c migrationData : migDataLst) {
            migrationData.Create_Renewal_Opportunity__c = true;
        }
        update migDataLst;
    }

}