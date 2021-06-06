/**
CST-2946 - All Quotes rejected in Callidus - Phani
**/
public class CPQQuoteReject {

	public void run() {
	    Set<String> quoteNumberSet = new Set<String>();
		List<CPQ_Quote__c> lstCPQQuotes = new List<CPQ_Quote__c>();
		Map<id,CPQ_Quote__c> cpqQuotesMap = new Map<id,CPQ_Quote__c>();
		 
		 for(CPQ_Quote_Line_Item__c cpqQuote : [SELECT Id,CPQ_Quote__c,CPQ_Quote__r.Id, CPQ_Quote__r.Status__c, CPQ_Quote__r.Opportunity__c,CPQ_Quote__r.Opportunity__r.IsClosed,CPQ_Quote__r.name,  Product_Code__c  from CPQ_Quote_Line_Item__c where Product_Code__c in ('PAN-CONSULT-ARCH-DAY',
			'PAN-CONSULT-CSS-STARTER','PAN-CONSULT-MIG-BRNZ','PAN-CONSULT-RE-6MO','PAN-CONSULT-SOC-ENHANCEMENT','PAN-CONSULT-THREAT-ASSESSMENT',
			'PAN-CONSULT-MIG-SLVR','PAN-CONSULT-MIG-GOLD','PAN-CONSULT-PLTFM-TRANSITION','PAN-CONSULT-NETWORK-ENFORCEMENT','PAN-CONSULT-TE') 
			and (Not CPQ_Quote__r.Status__c in ('Order Placed','Rejected','Auto-rejected')) and CPQ_Quote__r.Opportunity__r.IsClosed=false limit 500]){
		 
			if(!cpqQuotesMap.containsKey(cpqQuote.CPQ_Quote__r.Id)){
				CPQ_Quote__c quote = new CPQ_Quote__c(id=cpqQuote.CPQ_Quote__r.Id);
					quote.status__c ='Auto-rejected';
					//lstCPQQuotes.add(quote);
					cpqQuotesMap.put(cpqQuote.CPQ_Quote__r.Id,quote);
					String qNumber = cpqQuote.CPQ_Quote__r.Name.length() == 7 ? '0'+ cpqQuote.CPQ_Quote__r.Name : cpqQuote.CPQ_Quote__r.Name;
					quoteNumberSet.add(qNumber);
			}
	    }

        System.debug('quoteNumbers ' +quoteNumberSet.size());
        System.debug('cpqQuotesMap.size ' +cpqQuotesMap.size());
		
        if(quoteNumberSet.size() > 0){
		   List<String> listquoteNumber = new List<String>(quoteNumberSet);
           HlprCPQQuote.invokeRejectCallidusQuotes(listquoteNumber);
		 }
  
        if(cpqQuotesMap.size() > 0)
           update cpqQuotesMap.values();
	}
}