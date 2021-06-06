
public class UpdateOpportunityLineDiscount {
    public void run() {
        // actual running code
        System.debug('running');
        List<OpportunityLineItem> updateOppLines = new List<OpportunityLineItem>();

        String strQuery = 'SELECT Id, CPQ_Discount__c, SBQQ__QuoteLine__r.SBQQ__Discount__c, SBQQ__QuoteLine__r.Total_Discount__c ' +
                ' FROM OpportunityLineItem ' +
                ' where SBQQ__QuoteLine__c != null ' +
                ' and SBQQ__QuoteLine__r.SBQQ__Discount__c != null ' +
                ' and SBQQ__QuoteLine__r.Total_Discount__c != null limit 100';
        List<OpportunityLineItem> oppLines = Database.query(strQuery);
        for(OpportunityLineItem oppLine : oppLines) {
            if (oppLine.CPQ_Discount__c != null && oppLIne.SBQQ__QuoteLine__r.Total_Discount__c != null &&
                Math.roundToLong(oppLine.CPQ_Discount__c * 100.0) / 100.0 == Math.roundToLong(oppLIne.SBQQ__QuoteLine__r.Total_Discount__c * 100.0) / 100.0) {
                continue;
            }
            System.debug(' Id ' + oppLine.Id + ' CPQ_Discount__c ' + oppLine.CPQ_Discount__c +
                    ' SBQQ__Discount__c ' + oppLine.SBQQ__QuoteLine__r.SBQQ__Discount__c +
                    ' Total_Discount__c ' + oppLine.SBQQ__QuoteLine__r.Total_Discount__c);
            oppLine.CPQ_Discount__c = oppLIne.SBQQ__QuoteLine__r.Total_Discount__c;
            updateOppLines.add(oppLine);
        }

        // update
        if (updateOppLines.size() > 0) {
            System.debug(' Total lines to update ' + updateOppLines.size());
            update updateOppLines;
        }
    }
}

new UpdateOpportunityLineDiscount().run();
