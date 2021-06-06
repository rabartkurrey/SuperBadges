public class RejectPendingRenewalCortexQuotes {
    public void run() {
     
      }
      
 Set<Id> quoteIds = New Set<Id>();
         Map<Id,SBQQ__Quote__c> updateQuoteByIds = New Map<Id,SBQQ__Quote__c>();
         Map<Id,sbaa__Approval__c> updateApprovalsById = New Map<Id,sbaa__Approval__c>();
         for (SBQQ__QuoteLine__c eachBklnnPendingQuote : [Select id , SBQQ__Quote__c, SBQQ__Quote__r.SBQQ__Status__c , SBQQ__Product__r.Product_Group__c from SBQQ__QuoteLine__c where SBQQ__Quote__r.SBQQ__Status__c in ('Pending') and SBQQ__Product__r.Product_Group__c IN ('XSOAR' ,'XSOAR NFR' ,'XDR' ,'XDR NFR' ,'Demisto' ,'XDR') and SBQQ__Quote__r.SBQQ__Opportunity2__r.StageName != '10 - Closed - Won'and SBQQ__Quote__r.SBQQ__Opportunity2__r.StageName != '0 - Closed Lost' and SBQQ__Quote__r.SBQQ__Type__c = 'Renewal' ]) {
             SBQQ__Quote__c quoteObj = New SBQQ__Quote__c(Id=eachBklnnPendingQuote.SBQQ__Quote__c, SBQQ__Status__c = 'Rejected');
             updateQuoteByIds.put(quoteObj.Id, quoteObj);
             quoteIds.add(eachBklnnPendingQuote.SBQQ__Quote__c);
         }
        system.debug('quoteIds size-----'+quoteIds.size());
     update updateQuoteByIds.values();
         if (quoteIds.size() > 0 ) {
             for (sbaa__Approval__c eachApprovaltoReject : [Select id, sbaa__Status__c from sbaa__Approval__c where Quote__c =: quoteIds and sbaa__Status__c != 'Rejected']) {
                    sbaa__Approval__c approvalToReject = New sbaa__Approval__c(Id=eachApprovaltoReject.Id,sbaa__CommentsLong__c  = 'XDR-2264', sbaa__Status__c = 'Rejected');
                    updateApprovalsById.put(approvalToReject.Id, approvalToReject);
                }
        update updateApprovalsById.values();
         
         }    
     }
 }

