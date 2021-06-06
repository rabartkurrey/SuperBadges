
public class UpdateYearlyProratedMultiplier {
    public void run() {
        // actual running code
        System.debug('running');
        List<SBQQ__Subscription__c> updateSubs = new List<SBQQ__Subscription__c>();

        String strQuery = 'select id, SBQQ__Product__r.ProductCode, SBQQ__Quantity__c, SBQQ__ContractNumber__c, SBQQ__ProductName__c , SBQQ__StartDate__c, SBQQ__EndDate__c, '
                + ' SBQQ__ProrateMultiplier__c from SBQQ__Subscription__c where '
                + ' (SBQQ__ProrateMultiplier__c = 0 or SBQQ__ProrateMultiplier__c = null) and '
                + ' SBQQ__ProductName__c in (\'Demisto Enterprise Platform\', \'Demisto Enterprise Full User\', \'Demisto MSSP Base\', \'Demisto MSSP Full User\', \'Demisto Enterprise Audit User\',\'XDR Pro per TB\', \'XDR Pro per endpoint\') '
                + ' limit 2 '
        	    ;
        List<SBQQ__Subscription__c> subItems = Database.query(strQuery);
        for(SBQQ__Subscription__c sub : subItems) {
            if (sub.SBQQ__StartDate__c == null || sub.SBQQ__EndDate__c == null) {
                System.debug(' SBQQ__StartDate__c ' + sub.SBQQ__StartDate__c +
                        ' SBQQ__EndDate__c ' + sub.SBQQ__EndDate__c);
                continue;
            }
            Integer monthsBetween = sub.SBQQ__StartDate__c.monthsBetween(sub.SBQQ__EndDate__c);
            if (sub.SBQQ__EndDate__c.day() > sub.SBQQ__StartDate__c.day()) {
                monthsBetween++;
            }
            Double yearsBetween = Decimal.valueOf(monthsBetween) / 12;
            System.debug('SBQQ__ProductName__c ' + sub.SBQQ__ProductName__c +
                    ' SBQQ__StartDate__c ' + sub.SBQQ__StartDate__c +
                    ' SBQQ__EndDate__c ' + sub.SBQQ__EndDate__c +
                    ' SBQQ__ProrateMultiplier__c ' + sub.SBQQ__ProrateMultiplier__c + ' Calculated ' + yearsBetween);

            sub.SBQQ__ProrateMultiplier__c = yearsBetween;
            updateSubs.add(sub);
        }

        // update
        if (updateSubs.size() > 0) {
            update updateSubs;
        }
    }
}

new UpdateYearlyProratedMultiplier().run();
