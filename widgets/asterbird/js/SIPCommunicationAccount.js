const CONST_PRIVATE_IDENTITY = "privateIdentity";
const CONST_PUBLIC_IDENTITY = "publicIdentity";
const CONST_PASSWORD = "password";
const CONST_DISPLAY_NAME = "displayName";

class SIPCommunicationAccount{
    constructor(){
        this._privateIdentity = null;
        this._publicIdentity = null;
        this._password = null;
        this._displayName = null;

        this._loadAccountDataToLocalStorage();
    }

    setAccountData(privateIdentity, publicIdentity, password, displayName){
        this._privateIdentity = privateIdentity;
        this._publicIdentity = publicIdentity;
        this._password = password;
        this._displayName = displayName;

        this._saveAccountDataToLocalStorage(privateIdentity, publicIdentity, password, displayName);
    }

    get PrivateIdentity(){
        return this._privateIdentity;
    }

    get PublicIdentity(){
        return this._publicIdentity;
    }

    get Password(){
        return this._password;
    }

    get DisplayName(){
        return this._displayName;
    }

    IsCorrectInitialized(){
        if(this._privateIdentity && this._publicIdentity && this._password && this._displayName){
            return true;
        } else {
            return false;
        }
    }

    _saveAccountDataToLocalStorage(privateIdentity, publicIdentity, password, displayName){
        localStorage.setItem(CONST_PRIVATE_IDENTITY, privateIdentity);
        localStorage.setItem(CONST_PUBLIC_IDENTITY, publicIdentity);
        localStorage.setItem(CONST_PASSWORD, password);
        localStorage.setItem(CONST_DISPLAY_NAME, displayName);

    }

    _loadAccountDataToLocalStorage(){
        this._privateIdentity = localStorage.getItem(CONST_PRIVATE_IDENTITY);
        this._publicIdentity = localStorage.getItem(CONST_PUBLIC_IDENTITY);
        this._password = localStorage.getItem(CONST_PASSWORD);
        this._displayName = localStorage.getItem(CONST_DISPLAY_NAME);
    }

}
