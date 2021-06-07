/**
 * @description       : Persona REST Endpoint Class 
 * @author            : Nethaji Baskar
 * @group             : SalesTap
 * Modifications Log 
	Date         Author          Modification
	02-09-2021 	 Nethaji Baskar   Initial Version
**/
@RestResource(urlMapping='/Persona/list/*')
global with sharing class Rest_PersonaEndPoint {
    private static Datetime requestStartTime;
    
    global class ResponseWrapper extends Rest_BaseResponseWrapper{
        public Object records;
        public Integer totalSize;
        
        public ResponseWrapper(){            
            this.totalSize = 0;
        }
        
        /**
        * @description 
        * @author Nethaji Baskar
        * @param Object records 
        * @return Rest_BaseResponseWrapper 
        **/
        public override Rest_BaseResponseWrapper handleData(Object data){     
            Rest_PersonaWrapper.UserPersonas userPersona = (Rest_PersonaWrapper.UserPersonas) data;         
            this.totalSize = (userPersona.Personas == null ? 0 : userPersona.Personas.size());
            this.records =  data;     
            return setSuccessful();                    
        }
    } 

    /**
     * @description : 
     * @author      : Nethaji Baskar
     * @returnValue : returns List of Persona Metadata 
     */
    @HttpGet
    global static void getData() {
        RestRequest request = RestContext.request; 
        RestResponse response = RestContext.response;
        Rest_PersonaWrapperService personaWrapperService = new Rest_PersonaWrapperService(request);
        response.responseBody = Blob.valueOf(JSON.serializePretty(personaWrapperService.getUserPersonas(request)));
        response.statusCode = 200;   
    }


}
