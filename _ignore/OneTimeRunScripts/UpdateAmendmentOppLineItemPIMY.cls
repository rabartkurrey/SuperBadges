/**
 * Created by Paul Lee on 2020-11-19
 *
 *  Modification Log
 *  -----------------------------------------------------------
 *  Developer        Modification Date    Comments
 *  -----------------------------------------------------------
 *  Paul Lee         11/19/2020           NOVACPQ-1539 force recalculation of P+I/MY for Amendment Opportunity Line Items
 */
public class UpdateAmendmentOppLineItemPIMY {
    public void run() {
        // Query Opportunity Line Items created between date range and are from Amendment Quote Lines
        List<OpportunityLineItem> oliList = [
                select
                        P_OR_I__c,
                        Compensation_Calculated__c,
                        TotalPrice,
                        UnitPrice,
                        Quantity,
                        OpportunityId,
                        Product2Id,
                        PI_FunnelSource__c,
                        MultiYear_FunnelSource__c
                from OpportunityLineItem
                where CreatedDate = THIS_FISCAL_QUARTER
                and Opportunity.IsClosed = FALSE
                and SBQQ__QuoteLine__r.SBQQ__Quote__r.sbqq__type__c = 'Amendment'];

        List<OpportunityLineItem> oppLineItemsToCalPI = new List<OpportunityLineItem>();
        Map<Id, Decimal> mapOldPI = new Map<Id, Decimal>();
        Map<Id, Decimal> mapOldMY = new Map<Id, Decimal>();
        for (OpportunityLineItem oli : oliList) {
            if (oli.TotalPrice != oli.PI_FunnelSource__c + oli.MultiYear_FunnelSource__c) {
                oppLineItemsToCalPI.add(oli);
                mapOldPI.put(oli.Id, oli.PI_FunnelSource__c);
                mapOldMY.put(oli.Id, oli.MultiYear_FunnelSource__c);
            }
        }
        if (oppLineItemsToCalPI.size() > 0) {
            new OpportunityLineItemPICalculator().calculatePI(oppLineItemsToCalPI);
        }
        for (OpportunityLineItem oli : oppLineItemsToCalPI) {
            system.debug('=======> TO BE UPDATED OppLineId=' + oli.Id + ' oldPI=' + mapOldPI.get(oli.Id) + ' newPI=' + oli.Compensation_PI__c + ' oldMY=' + mapOldMY.get(oli.Id) + ' newMY=' + oli.Compensation_Multiyear__c);
        }
        if (oppLineItemsToCalPI.size() > 0) {
            //update oppLineItemsToCalPI;      // When ready to update, uncomment this line
        }
    }
}

new UpdateAmendmentOppLineItemPIMY().run();
