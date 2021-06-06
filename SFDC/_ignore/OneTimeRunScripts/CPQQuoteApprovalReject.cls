//   @Author      :  Leena Mandadapu
//   @Description :  Reject Quotes that are in Awaiting Approval Status. [CST-3101]
//   @Date        :  08/31/2020

public class CPQQuoteApprovalReject {

  public void processApprovalRejections() {
     processApprovalRejections(true); // default is to get count only
  }
    
  public void processApprovalRejections(boolean countOnly) {
        
        //Load Quote Numbers list here
        //Business doesn't want to pull the quotes using SOQL. 
        //So load the hard coded list once we get the approved Quotes data from business
        List<String> quotesReceivedLst = new List<String>{};
        
        List<String> quotestoProcessLst = new List<String>();
        List<String> quotesRemovedLst = new List<String>();
        Set<String> failedItems = new Set<String>();
        Set<String> successItems = new Set<String>();
        Map<id,CPQ_Quote__c> quotesMap = new Map<id,CPQ_Quote__c>();
        Set<String> processCPQQuotes = new Set<String>();
        List<String> sendtoCPQLst = new List<String>();

        //Check the current Quote status.
        //Only process quotes that are currently in the Awaiting Approval status. 
        //If the status changed by the time this script is executed, do not process the record and add it to removed list and provide the info in the status email
        for(CPQ_Quote__c cpqQuote : [SELECT Id, Status__c, Name from CPQ_Quote__c where Name IN :quotesReceivedLst]) {
            if(cpqQuote.Status__c == 'Awaiting Approval') {
               quotestoProcessLst.add(cpqQuote.Id);
               quotesMap.put(cpqQuote.Id,cpqQuote);
            } else {
               quotesRemovedLst.add(cpqQuote.Name);
            }  
        }

        System.debug('No of Quotes Received =' +quotesReceivedLst.size());
        System.debug('No of Quotes to Process =' +quotestoProcessLst.size());
        System.debug('No of Quotes  Removed =' +quotesRemovedLst.size());
        System.debug('Quotes to process ' + quotestoProcessLst);

        List<Approval.ProcessWorkitemRequest> processWorkItemsLst = new List<Approval.ProcessWorkItemRequest>();
        if(quotestoProcessLst.size() > 0 && !countOnly){
        for(ProcessInstance instance : [Select ID, Status, TargetObject.Name, (SELECT Id, ActorId, ProcessInstanceId FROM Workitems),(SELECT Id, StepStatus, Comments FROM Steps) From ProcessInstance Where TargetObjectID IN :quotestoProcessLst AND Status = 'Pending']){
              for(ProcessInstanceWorkItem workItem : instance.WorkItems){
                    Approval.ProcessWorkitemRequest processWrkItem = new Approval.ProcessWorkitemRequest();
                    processWrkItem.setWorkItemID(workItem.id);
                    processWrkItem.setComments('Rejected due to Price Change');
                    processWrkItem.setAction('Reject');
                    processWorkItemsLst.add(processWrkItem);
                }
                processCPQQuotes.add(instance.TargetObjectID);
            }
            
            //Call Send to CPQ as the current CPQ trigger will not send the updated status if the list size > 1
            for(String qId : processCPQQuotes) {
               sendtoCPQLst.add(quotesMap.get(qId).Name);
            }
            if(sendtoCPQLst.size()>0) {
               HlprCPQQuote.invokeRejectCallidusQuotes(sendtoCPQLst); 
            }
            
            system.debug('Process Instance Work Items List = '+ processWorkItemsLst);        
            if(processWorkItemsLst.size() > 0) {
              try {
                    Approval.ProcessResult[] appProcessResult = Approval.process(processWorkItemsLst);
                    system.debug('ProcessResult = '+ appProcessResult);
                    for(Approval.ProcessResult apRes : appProcessResult) {
                      if(!apRes.isSuccess()) {
                         failedItems.add(quotesMap.get(apRes.getEntityId()).Name);    
                      } else{
                         successItems.add(quotesMap.get(apRes.getEntityId()).Name);
                      }
                    }
                    system.debug('Failed Items = '+failedItems);
                    system.debug('Success Items = '+successItems);
                } catch(Exception e) {
                   system.debug('Exception Occured = '+ e.getMessage());
                }
            }
        }    
      
        //Send email
        String subject = 'Awaiting Approval Quotes Auto Rejection Process Results';
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new String[] {'lmandadapu@paloaltonetworks.com'});
        String plainTextBody = 'Awaiting Approval Quotes Auto Rejection Process Results.\n';
        plainTextBody += 'No. of Quotes Received             : ' + quotesReceivedLst.size() + '\n';
        plainTextBody += 'No. of Quotes Excluded             : ' + quotesRemovedLst.size() + '\n';
        plainTextBody += 'No. of Quotes Processed            : ' + quotestoProcessLst.size() + '\n';
        plainTextBody += 'No. of Quotes Successfully Rejected : ' + successItems.size() + '\n';
        plainTextBody += 'No. of Quotes Failed to Reject.    : ' + failedItems.size() + '\n';
        plainTextBody += '\n';
        plainTextBody += 'Successful Quotes are : \n';
        plainTextBody += String.join(new List<String>(successItems), '\n');
        plainTextBody += '\n';
        plainTextBody += 'Failed Quotes are : \n';
        if(failedItems.size()>0) {
           plainTextBody += String.join(new List<String>(failedItems), '\n');
           plainTextBody += '\n';
        } else {
           plainTextBody += 'NONE \n\n';
        }
        plainTextBody += 'Quotes removed due to Status mismatch are : \n';
        if(quotesRemovedLst.size()>0) {
          plainTextBody += String.join(quotesRemovedLst, '\n');
          plainTextBody += '\n';
        } else {
          plainTextBody += 'NONE \n\n';
        }
        
        email.setSubject(subject);
        email.setPlainTextBody(plainTextBody);
        Messaging.SendEmailResult [] r = Messaging.sendEmail(new Messaging.SingleEmailMessage[] {email});
  }  
}
    
new CPQQuoteApprovalReject().processApprovalRejections(false); //set to true or blank if you only want to get the counts. Set to False, to Reject the quotes
