/**
 *  @Name:          ApproverRecordsFix 
 *  @Description:   This is a one time script to Remove Duplicate Approver records,
 * 					add the approver in the approver rules when related duplicate approver is deleted.
 * 					assignUsersToMissingApprovers - Assign users to missing approver records
 *  @Author:        Ranga Velineni
 *  @Date:          11-30-2020
 *
 *  Change Log
 *  -----------------------------------------------------------
 *  Developer           Modification Date           Comments
 *  -----------------------------------------------------------
 *  Ranga Velineni		 11/23/2020               Initial Version
 *  
 **/
public class ApproverRecordsFix{
//public class ApproverRecordsFix implements Queueable{
    //public void execute(QueueableContext context) {
    public void removeDuplicates(){
        List<AggregateResult> duplicateApprovers=[SELECT sbaa__User__c, count(Id) FROM Sbaa__Approver__c WHERE
                                                  sbaa__User__c!=NULL GROUP BY sbaa__User__c HAVING count(Id)>1 limit 40 ];
        
        List<Id> userIds = new list<Id>();
        Map<Id,List<Id>> usersApproverIdsMap =new Map<Id,List<Id>>();
        Integer count =0;
        //Duplicate Approvers User Ids
        for(AggregateResult Usr : duplicateApprovers)
        {
            count++;
            userIds.add((Id)Usr.get('sbaa__User__c'));
        }
        List<Sbaa__Approver__c> queryResults = [SELECT ID,sbaa__User__c FROM Sbaa__Approver__c where sbaa__User__c in :userIds]; //in :userIds where sbaa__User__c ='' user id not approver id
        // Users and its Duplicate Approver Records
        for (Sbaa__Approver__c approver : queryResults){
            if(usersApproverIdsMap.containsKey(approver.sbaa__User__c)){
                usersApproverIdsMap.get(approver.sbaa__User__c).add(approver.Id);
            }
            else{
                usersApproverIdsMap.put(approver.sbaa__User__c, new List<Id>{approver.Id});
            }
        }
        set<id> approverIds = new Set<Id>();
        set<id> approverIdsToSkip = new Set<Id>();
        
        list<Sbaa__ApprovalRule__c> rules = new List<Sbaa__ApprovalRule__c>();
        // list of Approver Ids to Delete and Approver Rules to Update
        for(Id userId : usersApproverIdsMap.keyset()){
            Integer i = 0;
            for(Sbaa__ApprovalRule__c rule : [select id,sbaa__Approver__c from Sbaa__ApprovalRule__c where sbaa__Approver__c in :usersApproverIdsMap.get(userId)]){
                //rule.sbaa__Approver__c = usersApproverIdsMap.get(userId)[0];
                //rules.add(rule);
                approverIdsToSkip.add(rule.sbaa__Approver__c);

                
            }
            //Approver Records with Approvals to skip
            for(sbaa__Approval__c  approval : [select id,sbaa__Approver__c,Name from sbaa__Approval__c  where sbaa__Approver__c in :usersApproverIdsMap.get(userId)]){ 
                if(approval.sbaa__Approver__c != null)
                    approverIdsToSkip.add(approval.sbaa__Approver__c);
                
            }
            
            
            for(Id approverId : usersApproverIdsMap.get(userId)){
                if(i>0 && !approverIdsToSkip.contains(approverId)){
                    approverIds.add(approverId);
                }
                i++;
            }
            
        }
        
        //if(rules.size() > 0)
          //  update rules;
        if(approverIds.size() > 0)
            Database.delete ([select id from Sbaa__Approver__c where id in:approverIds],false);
        
        
        /*List<AggregateResult> duplicateToProcess=[SELECT sbaa__User__c, count(Id) FROM Sbaa__Approver__c WHERE
                                                  sbaa__User__c!=NULL GROUP BY sbaa__User__c HAVING count(Id)>1];
        if(duplicateToProcess.size() > 0 && !Test.isRunningTest()) System.enqueueJob(new ApproverRecordsFix());*/
    }
    
    public void assignUsersToMissingApprovers(){
        
        List <sbaa__Approver__c> approverToUpdate = new List<Sbaa__Approver__c>();
        map<string, Id> mapApproverUserNameAndId = new map<string, Id> ();
        try {
        //Approver Records with No User Assigned
        List<sbaa__Approver__c> approverRecordsWithNoUser = [Select id, Name from Sbaa__Approver__c where sbaa__user__c = null and sbaa__GroupId__c = null];
        set<string> approverNames = new set<string> ();
        for (sbaa__Approver__c approverRecords: approverRecordsWithNoUser) {
            approverNames.add(approverRecords.Name);
        }
        //list of user name and id's for that approver records with missing users
        List<user> userName = [select id,name from user where Name IN: approverNames];
        for (user usr: userName){
            mapApproverUserNameAndId.put(usr.Name, usr.Id);
        }
        //Map approver Record names with user names
        for (sbaa__Approver__c approverRecords: approverRecordsWithNoUser) {
            approverRecords.sbaa__user__c = mapApproverUserNameAndId.get(approverRecords.Name);
            approverToUpdate.add(approverRecords);
        }
            Update approverToUpdate;
        }catch(exception e){
            system.debug(''+e); 
        }
    }
}
new ApproverRecordsFix().removeDuplicates(); // Use to remove Duplicates
new ApproverRecordsFix().assignUsersToMissingApprovers(); // Use to assign users to missing approver records