/**
 *  @Name:          CreateOrderSummaryAndConfirmationPDF
 *  @Description:   This is a one time script to attach the Order Summary / Order Confirmation Documents
 *					on the corresponding Opportunity.
 *  @Author:        Mahesh Devarasetti
 *  @Date:          June-10-2020
 *
 *  Change Log
 *  -----------------------------------------------------------
 *  Developer           Modification Date           Comments
 *  -----------------------------------------------------------
 *  Mahesh Devarasetti   June/10/2020               Initial Version
 *
 **/
public class CreateOrderSummaryAndConfirmationPDF {
    public void findAndCreatePDF(Integer limitRecordCount) {
        System.debug('CreateOrderSummaryAndConfirmationPDF: findAndCreatePDF: Start Running the Script.');
		Set<Id> oppIdSet = new Set<Id>();
		Map<Id, Order> oppIdOrderMap = new Map<Id, Order>();

		Integer count = 0;
		for(Order ord : [SELECT Id, OpportunityId, LastModifiedById, ActivatedDate, SBQQ__Quote__r.Billing_Docusign_Contact__r.Email, SBQQ__Quote__r.isEDIOpportunity__c from Order where Status = 'Activated' AND OpportunityId != null AND ActivatedDate = LAST_N_DAYS:30]) {
			oppIdSet.add(ord.OpportunityId);
			oppIdOrderMap.put(ord.OpportunityId, ord);
		}

		Map<Id,Id> orderSummaryMap = new Map<Id,Id>();
		Map<Id,Id> orderConfirmMap = new Map<Id,Id>();
		for(Task tmpTask: [SELECT Id, Subject, WhatID FROM Task WHERE Subject like 'Email: ref 006%' AND WHATID IN: oppIdSet Order By WhatId]) {
			if(tmpTask.Subject.endsWith('Order Confirmation')) {
				orderConfirmMap.put(tmpTask.WhatId, tmpTask.Id);
			}
			if(tmpTask.Subject.endsWith('Order Summary')) {
				orderSummaryMap.put(tmpTask.WhatId, tmpTask.Id);
			}
		}

		for(Id oppId: oppIdSet) {
			if(orderSummaryMap.get(oppID) == null || orderConfirmMap.get(oppId) == null) {
				count++;
				System.debug(oppId + ' ' + orderSummaryMap.get(oppID) + ' ' + orderConfirmMap.get(oppId) + ' ' + oppIdOrderMap.get(oppId).ActivatedDate+ ' ' + oppIdOrderMap.get(oppId)+ ' ' + oppIdOrderMap.get(oppId).SBQQ__Quote__r.Billing_Docusign_Contact__r.Email+' '+oppIdOrderMap.get(oppId).SBQQ__Quote__r.isEDIOpportunity__c);
				if(count <= limitRecordCount) {
					System.debug('***********************************START**********************************************');
					Id orderId = oppIdOrderMap.get(oppId).Id;
					Id opportunityId = oppId;
					Id lastModifiedByUserId = oppIdOrderMap.get(oppId).LastModifiedById;
					if(orderSummaryMap.get(oppID) == null ) {
						String emailTemplateName = 'Mktp_Order_Summary_Email_Confirmation';
						MktpPDFOrderCreationAttachment.pdfGenerationFuture(orderId, opportunityId, emailTemplateName, lastModifiedByUserId);
					}

					if(orderConfirmMap.get(oppId) == null) {
						String emailTemplateName = 'MKTP_New_Order_Confirmation_Notification';
						MktpPDFOrderCreationAttachment.pdfGenerationFuture(orderId, opportunityId, emailTemplateName, lastModifiedByUserId);
					}
					System.debug('***********************************END**********************************************');
				}
			}
		}
        System.debug('CreateOrderSummaryAndConfirmationPDF: findAndCreatePDF: count: '+count);
    }
}

new CreateOrderSummaryAndConfirmationPDF().findAndCreatePDF(1);