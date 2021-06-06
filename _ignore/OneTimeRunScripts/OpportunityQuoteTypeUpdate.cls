public class OpportunityQuoteTypeUpdate {
	public void run() {
	    List<Opportunity> oppList = [SELECT Id,Quote_Type__c FROM Opportunity WHERE SBQQ__RenewedContract__r.Migration_Data__c != null AND Quote_Type__c = 'CPQ Renewals' LIMIT 300];
	    if (null != oppList && !oppList.isEmpty()) {
		for (Opportunity o : oppList) {
		    o.Quote_Type__c = 'Steelbrick Renewals';
		}
		update oppList;
	    }
	}
}