// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../../utils";
import type { UserManagerSettingsStore } from "../../UserManagerSettings";
import { CordovaWindow, type CordovaWindowParams } from "./CordovaWindow";
import type { INavigator } from "../../navigators/INavigator";

/**
 * @internal
 */
export class CordovaNavigator implements INavigator {
    private readonly _logger = new Logger("CordovaNavigator");

    constructor(private _settings: UserManagerSettingsStore) {}
    
    public async prepare({
        popupWindowTarget = this._settings.popupWindowTarget,
    }: CordovaWindowParams): Promise<CordovaWindow> {
        return new CordovaWindow({ popupWindowTarget });
    }

    public async callback(url: string): Promise<void> {
        this._logger.create("callback");
        // ICordovaWindow.notifyParent(url, this._settings.iframeNotifyParentOrigin);
    }
}
