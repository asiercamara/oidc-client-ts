// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../../utils";
import type { NavigateParams, NavigateResponse } from "../../navigators/IWindow";
import { AbstractChildWindow } from "../../navigators/AbstractChildWindow";

const CORDOVA_PLUGIN_ID = "cordova-plugin-oauth";

interface AuthMesageData {
    code: string;
    state: string;
}

interface MessageData {
    source: string;
    url: string;
    keepOpen: boolean;
}

/**
     * @public
     */
export interface CordovaWindowParams {
    popupWindowTarget?: string;
}

/**
 * @internal
 */
export class CordovaWindow extends AbstractChildWindow {
    protected readonly _logger = new Logger("CordovaWindow");
    protected _popupWindowTarget: string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    public static hasCordovaPlugin = (): boolean => !!(Object.prototype.hasOwnProperty.call(window, "cordova")
                                                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                                        && (window as any).cordova.require("cordova/plugin_list").metadata[CORDOVA_PLUGIN_ID]);

    public constructor({
        popupWindowTarget = "oauth:externañ-auth'",
    }: CordovaWindowParams) {
        super();
        if (!CordovaWindow.hasCordovaPlugin()) {
            throw new Error(`CordovaWindow solo funciona con cordova y el plugin ${CORDOVA_PLUGIN_ID}`);
        }
        this._popupWindowTarget=popupWindowTarget;
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        this._logger.debug("navigate: Using popupWindowTarget: ", this._popupWindowTarget);
        return await this._navigate(params);
    }

    private async _navigate(params: NavigateParams): Promise<NavigateResponse> {
        const logger = this._logger.create("_navigate");
        
        logger.debug("setting URL in window");
        // en este caso no hay window ya que hay que hacerlo cada vez
        //this._window.location.replace(params.url);

        window.open(params.url, this._popupWindowTarget);

        const { url } = await new Promise<MessageData>((resolve) => {
            
            const listener = (event: MessageEvent) => {

                logger.debug(`entro en message con event.data ${JSON.stringify(event.data)}`);
                const eventData:string = event.data;
                if (eventData?.match(/^oauth::/)) {
                    logger.debug(`doSignin callback message event: ${eventData}`);
                    const data:AuthMesageData = JSON.parse(eventData.substring(7));
                    // Use data.code
                    logger.debug(JSON.stringify(data));
                    //data.code// state
                    const state = data.state;
                    if (!state) {
                        logger.warn("no state found in response url");
                    }

                    if (state !== params.state) {
                        // MessageEvent source is a relatively modern feature, we can't rely on it
                        // so we also inspect the payload for a matching state key as an alternative
                        return;
                    }
                    // para compatiblidad, este método debe devolver url callback finalmente
                    //  le valdrá un un fake o lo recreo entero
                    const fakeUrl = `blablabla://host/fakeCallback?code=${data.code}&state=${data.state}`;
                    const finalData:MessageData = {
                        source: "", // no es origin, es source que sería la ventana que origina mensaje
                        url: fakeUrl,
                        keepOpen: false,
                    };
    
                    resolve(finalData);

                }

            };
            window.addEventListener("message", listener, { once : true });
        });
        logger.debug("got response from window");

        return { url };
    }

    public close(): void {
        
        this._window = null;
    }

}
