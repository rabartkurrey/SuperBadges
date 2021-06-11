/**
* @description       : WrapperService to call user details
* @author            : Rabart Kurrey
* @group             : 
* @last modified on  : 02-02-2020
* @last modified by  : 
* Modifications Log 
* Ver   Date         Author          Modification
* 1.0  02-02-2020   Rabart Kurrey   Initial Version
**/

public with sharing class Rest_PersonaWrapperService {
    private ErrorLogService logger;
    System.debug('helo');
    private static final String REQUEST_CONTEXT = 'SalesTapPersonaService';
    private String appName;
    public Rest_PersonaWrapperService(RestRequest request){
         logger = new ErrorLogService(Rest_PersonaWrapperService.class, appName);
         // Parse API Parameters
         Map<String, String> requestParamsMap = new Map<String, String>();
         if(request != null && request.params != null && request.params.isEmpty() == false){
            for(String eachParam: request.params.keySet()){
               requestParamsMap.put(eachParam.toLowerCase(), request.params.get(eachParam));
            }
         }
         if(requestParamsMap.containsKey(Rest_Constants.ATTRIBUTE_APP)){
            appName = requestParamsMap.get(Rest_Constants.ATTRIBUTE_APP);
         } else {
            appName = Rest_Constants.SALESTAP_APP;
         }
    }

    public Rest_PersonaWrapperService(){
      logger = new ErrorLogService(Rest_PersonaWrapperService.class, 'SalesTap');
    }

    /**
    * @description Method to get User Personas for Rest API Endpoint
    * @author Netahji Baskar | 03-03-2021 
    * @param RestRequest req 
    * @return Rest_PersonaEndPoint.ResponseWrapper 
    **/
    public Rest_BaseResponseWrapper getUserPersonas(RestRequest request){
      Rest_PersonaEndPoint.ResponseWrapper responseWrapper = new Rest_PersonaEndPoint.ResponseWrapper();
      String userID = (String)Userinfo.getUserId();
      
      try{
         // Get User Record Details
         Rest_PersonaWrapper.UserPersonas userPersonas = new Rest_PersonaWrapper.UserPersonas();
         userPersonas.User = populateUserDetails(userID);
         //Get User Persona Details
         List<Rest_PersonaWrapper.Persona> personaMetadataList = getUserPersonaMetadata(UserId, appName);
         userPersonas.Personas = personaMetadataList;
         responseWrapper.handleData(userPersonas);

      } catch(Exception ex){
            logger.atError().withFunctionality(REQUEST_CONTEXT).withApiRequest(request).withCause(ex).publish();
            responseWrapper.handleException( REQUEST_CONTEXT, ex, '');
            return responseWrapper;
      }

      return responseWrapper;
    }

    /**
    * @description to evaluate User Persona(s) and pull the corresponding Metadata from Platform Cache
    * @author Nethaji Baskar | 03-03-2021 
    * @param String UserId
    * @param String appName 
    * @return List<Object> userPersonaMetadata 
    **/
    public List<Rest_PersonaWrapper.Persona> getUserPersonaMetadata(String UserId, String appName){
      List<Rest_PersonaWrapper.Persona> personaMetadataList = new List< Rest_PersonaWrapper.Persona>();
      try{
         List<String> userPersonaList = new List<String>();
         Map<String, Rest_PersonaWrapper.Persona> personaMetadataMap = new Map<String, Rest_PersonaWrapper.Persona>();
         PersonaHandler personaHandler = new PersonaHandler(appName);

         // Get User Personas
         Map<String, List<String>> userPersonasMap = personaHandler.getUserPersonas(new List<String>{userID}, appName);
         userPersonaList.addall(userPersonasMap.get(userID));
         Object personaMetadata = personaHandler.getPersonaMetadataFromCache(appName);

         // Handle Platform Cache Miss
         if(personaMetadata == null){
            personaMetadataMap = personaHandler.getAppPersonaMetadata(appName, Rest_Constants.PERSONA_LEVEL_APP);
            personaMetadata =  (Object) personaMetadataMap;
            System.enqueueJob(new personaHandler.PersonaCacheUpdateQueuable(Rest_Constants.PERSONA_PARTITION_NAME, appName + Rest_Constants.ATTRIBUTE_PERSONA, personaMetadata));
         } else{
         // Handle Data from Platform Cache   
            personaMetadataMap = (Map<String, Rest_PersonaWrapper.Persona>) personaMetadata;
         }      
      
         for(String eachPersona: userPersonaList){
            personaMetadataList.add(personaMetadataMap.get(eachPersona));
         }
      } catch(Exception ex){
         logger.atError().withFunctionality(REQUEST_CONTEXT).withCause(ex).publish();
      }

      return personaMetadataList;
    }
   
    
   public Rest_PersonaWrapper.UserDetail populateUserDetails(String userId){
       Rest_PersonaWrapper.UserDetail userDetail = new Rest_PersonaWrapper.UserDetail();
       try{
           if(String.isBlank(userId)){
              logger.atError().withFunctionality(REQUEST_CONTEXT).withCause('Input parameters are null in populateUserDetails ()').publish();
           }
           
           List<String> whereClause = new List<String>{'Id ='+'\''+userId+'\''};
           List<User> userList = Rest_UserWrapperService.queryUser(whereClause);
           if(userList!=null && userList.size()>0){  
               if(userList[0].Profile.Name!=null){
                   userDetail.profileName = (String)userList[0].Profile.Name;
               }
               SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE,userList,true);
               userList = decision.getRecords();
               List<String> strippedFieldsSet = new List<String>();
               if(decision.getRemovedFields()!=null && !decision.getRemovedFields().isEmpty()){
                    for(String eachField: decision.getRemovedFields().keySet()){
                    strippedFieldsSet.add(eachField.toUppercase());
                    }
                }
                userDetail.Id = (String)userList[0].Id;
                userDetail.Name = (String)userList[0].Name;
                userDetail.Email = strippedFieldsSet.contains('Email') ? null : (String)userList[0].Email ;
                userDetail.profileId = strippedFieldsSet.contains('Profile.Id') ? null : (String)userList[0].Profile.Id;
                userDetail.UserName = strippedFieldsSet.contains('UserName') ? null : (String)userList[0].UserName;
                
                if(userList[0].LanguageLocaleKey!=null){
                    userDetail.languageLocalKey = strippedFieldsSet.contains('LanguageLocaleKey') ? null : (String)userList[0].LanguageLocaleKey;
                }
                if(userList[0].LocaleSidKey!=null){
                   userDetail.localeSidKey = strippedFieldsSet.contains('LocaleSidKey') ? null : (String)userList[0].LocaleSidKey;
                }
                if(userList[0].City!=null){
                   userDetail.City = strippedFieldsSet.contains('City') ? null : (String)userList[0].City;
                }
                if(userList[0].State!=null){
                   userDetail.State = strippedFieldsSet.contains('State') ? null : (String)userList[0].State;
                }
                if(userList[0].Country!=null){
                   userDetail.Country = strippedFieldsSet.contains('Country') ? null : (String)userList[0].Country;
                }
                if(userList[0].hasAcceptedEULA__c!=null){
                   userDetail.hasAcceptedEULA = strippedFieldsSet.contains('hasAcceptedEULA') ? null : (Boolean)userList[0].hasAcceptedEULA__c;
                }
           }
          
       }catch(Exception e){
            logger.atError().withFunctionality(REQUEST_CONTEXT).withCause(e).publish();
       }
        return userDetail;
   }
   
}
