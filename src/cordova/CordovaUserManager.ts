import {
    type ExtraSigninRequestArgs, type ExtraSignoutRequestArgs, UserManager,
} from "../UserManager";

import type { SignoutResponse } from "../SignoutResponse";
import { User } from "../User";
import { type UserManagerSettings } from "../UserManagerSettings";
import { CordovaNavigator, type CordovaWindowParams } from "./navigators";

/**
 * @public
 */
export type SigninCordovaArgs = CordovaWindowParams & ExtraSigninRequestArgs;
/**
 * @public
 */
export type SignoutCordovaArgs = CordovaWindowParams & ExtraSignoutRequestArgs;

/**
 * Extended UserManager class that adds helpers and mobile capabilities
 * (ex: signinMobile, signoutMobile, MobileNavigator, MobileWindow)
 */
/**
 * @public
 */
export class CordovaUserManager extends UserManager {
    private static readonly SIGNIN_REQUEST_TYPE = "si:c";
    private static readonly SIGNOUT_REQUEST_TYPE = "so:c";
    private _cordovaNavigator!: CordovaNavigator;

    constructor(settings: UserManagerSettings) {
        super(settings);

        this._cordovaNavigator = new CordovaNavigator(this.settings);
    }

    public async signinCordova(args: SigninCordovaArgs = {}): Promise<void> {
        const logger = this._logger.create("signinCordova");

        const {
            popupWindowTarget,
            ...requestArgs
        } = args;

        const handle = await this._cordovaNavigator.prepare({ popupWindowTarget });

        const user = await this._signin({
            request_type: CordovaUserManager.SIGNIN_REQUEST_TYPE,
            redirect_uri: this.settings.redirect_uri,
            ...requestArgs,
        }, handle);

        if (user?.profile?.sub) {
            logger.info("success, signed in subject", user.profile.sub);
        } else {
            logger.info("no subject");
        }
    }

    public async signoutCordova(args: SignoutCordovaArgs = {}): Promise<void> {
        const logger = this._logger.create("signoutCordova");

        const {
            popupWindowTarget,
            ...requestArgs
        } = args;

        const url = this.settings.popup_post_logout_redirect_uri;

        const handle = await this._cordovaNavigator.prepare({ popupWindowTarget });

        await this._signout({
            request_type: CordovaUserManager.SIGNOUT_REQUEST_TYPE,
            post_logout_redirect_uri: url,
            // we're putting a dummy entry in here because we
            // need a unique id from the state for notification
            // to the parent window, which is necessary if we
            // plan to return back to the client after signout
            // and so we can close the popup after signout
            state: url == null ? undefined : {},
            ...requestArgs,
        }, handle);

        logger.info("success");
    }

    // @override 
    public async signinCallback(url = window.location.href): Promise<User | undefined> {
        const { state } = await this._client.readSigninResponseState(url);
        
        if (state.request_type == CordovaUserManager.SIGNIN_REQUEST_TYPE) {
            await this.signinCordobaCallback(url);
        } else {
            await super.signinCallback(url);
        }
        return undefined;
    }

    // @override 
    public async signoutCallback(url = window.location.href): Promise<SignoutResponse | undefined> {
        const { state } = await this._client.readSignoutResponseState(url);
        if (!state) {
            return;
        }

        if (state.request_type == CordovaUserManager.SIGNOUT_REQUEST_TYPE) {
            await this.signoutCordobaCallback(url);
        } else {
            await super.signoutCallback(url);
        }    
    }

    /**
     * Returns promise to notify the opening window of response from the authorization endpoint.
     */
    public async signinCordobaCallback(url = window.location.href): Promise<void> {
        const logger = this._logger.create("signinCordobaCallback");
        await this._cordovaNavigator.callback(url);
        logger.info("success");
    }

    /**
     * Returns promise to process response from the end session endpoint from a popup window.
     */
    public async signoutCordobaCallback(url = window.location.href): Promise<void> {
        const logger = this._logger.create("signoutCordobaCallback");
        await this._cordovaNavigator.callback(url);
        logger.info("success");
    }
}