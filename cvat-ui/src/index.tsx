// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import { ExtendedKeyMapOptions } from 'react-hotkeys';
import { BrowserRouter } from 'react-router-dom';

import CVATApplication from 'components/cvat-app';

import createRootReducer from 'reducers/root-reducer';
import createCVATStore, { getCVATStore } from 'cvat-store';
import logger, { LogType } from 'cvat-logger';

import {
    authorizedAsync,
    loadAuthActionsAsync,
} from 'actions/auth-actions';
import { getFormatsAsync } from 'actions/formats-actions';
import { getPluginsAsync } from 'actions/plugins-actions';
import { getUsersAsync } from 'actions/users-actions';
import { getAboutAsync } from 'actions/about-actions';
import { getModelsAsync } from 'actions/models-actions';
import { getUserAgreementsAsync } from 'actions/useragreements-actions';
import { shortcutsActions } from 'actions/shortcuts-actions';
import { switchSettingsDialog } from 'actions/settings-actions';
import { resetErrors, resetMessages } from './actions/notification-actions';
import { CombinedState, NotificationsState } from './reducers/interfaces';

createCVATStore(createRootReducer);
const cvatStore = getCVATStore();

interface StateToProps {
    pluginsInitialized: boolean;
    pluginsFetching: boolean;
    modelsInitialized: boolean;
    modelsFetching: boolean;
    userInitialized: boolean;
    userFetching: boolean;
    usersInitialized: boolean;
    usersFetching: boolean;
    aboutInitialized: boolean;
    aboutFetching: boolean;
    formatsInitialized: boolean;
    formatsFetching: boolean;
    userAgreementsInitialized: boolean;
    userAgreementsFetching: boolean;
    authActionsFetching: boolean;
    authActionsInitialized: boolean;
    allowChangePassword: boolean;
    allowResetPassword: boolean;
    notifications: NotificationsState;
    user: any;
    keyMap: Record<string, ExtendedKeyMapOptions>;
    isModelPluginActive: boolean;
}

interface DispatchToProps {
    loadFormats: () => void;
    verifyAuthorized: () => void;
    loadUsers: () => void;
    loadAbout: () => void;
    initModels: () => void;
    initPlugins: () => void;
    resetErrors: () => void;
    resetMessages: () => void;
    switchShortcutsDialog: () => void;
    loadUserAgreements: () => void;
    switchSettingsDialog: () => void;
    loadAuthActions: () => void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const { plugins } = state;
    const { auth } = state;
    const { formats } = state;
    const { users } = state;
    const { about } = state;
    const { shortcuts } = state;
    const { userAgreements } = state;
    const { models } = state;

    return {
        userInitialized: auth.initialized,
        userFetching: auth.fetching,
        pluginsInitialized: plugins.initialized,
        pluginsFetching: plugins.fetching,
        modelsInitialized: models.initialized,
        modelsFetching: models.fetching,
        usersInitialized: users.initialized,
        usersFetching: users.fetching,
        aboutInitialized: about.initialized,
        aboutFetching: about.fetching,
        formatsInitialized: formats.initialized,
        formatsFetching: formats.fetching,
        userAgreementsInitialized: userAgreements.initialized,
        userAgreementsFetching: userAgreements.fetching,
        authActionsFetching: auth.authActionsFetching,
        authActionsInitialized: auth.authActionsInitialized,
        allowChangePassword: auth.allowChangePassword,
        allowResetPassword: auth.allowResetPassword,
        notifications: state.notifications,
        user: auth.user,
        keyMap: shortcuts.keyMap,
        isModelPluginActive: plugins.list.MODELS,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        loadFormats: (): void => dispatch(getFormatsAsync()),
        verifyAuthorized: (): void => dispatch(authorizedAsync()),
        loadUserAgreements: (): void => dispatch(getUserAgreementsAsync()),
        initPlugins: (): void => dispatch(getPluginsAsync()),
        initModels: (): void => dispatch(getModelsAsync()),
        loadUsers: (): void => dispatch(getUsersAsync()),
        loadAbout: (): void => dispatch(getAboutAsync()),
        resetErrors: (): void => dispatch(resetErrors()),
        resetMessages: (): void => dispatch(resetMessages()),
        switchShortcutsDialog: (): void => dispatch(shortcutsActions.switchShortcutsDialog()),
        switchSettingsDialog: (): void => dispatch(switchSettingsDialog()),
        loadAuthActions: (): void => dispatch(loadAuthActionsAsync()),
    };
}

const ReduxAppWrapper = connect(
    mapStateToProps,
    mapDispatchToProps,
)(CVATApplication);

ReactDOM.render(
    (
        <Provider store={cvatStore}>
            <BrowserRouter>
                <ReduxAppWrapper />
            </BrowserRouter>
        </Provider>
    ),
    document.getElementById('root'),
);

window.addEventListener('error', (errorEvent: ErrorEvent) => {
    if (errorEvent.filename
        && typeof (errorEvent.lineno) === 'number'
        && typeof (errorEvent.colno) === 'number'
        && errorEvent.error) {
        const logPayload = {
            filename: errorEvent.filename,
            line: errorEvent.lineno,
            message: errorEvent.error.message,
            column: errorEvent.colno,
            stack: errorEvent.error.stack,
        };

        const store = getCVATStore();
        const state: CombinedState = store.getState();
        const { pathname } = window.location;
        const re = RegExp(/\/tasks\/[0-9]+\/jobs\/[0-9]+$/);
        const { instance: job } = state.annotation.job;
        if (re.test(pathname) && job) {
            job.logger.log(LogType.sendException, logPayload);
        } else {
            logger.log(LogType.sendException, logPayload);
        }
    }
});
