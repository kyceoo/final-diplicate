const Localize = ({ i18n_default_text, values }) => {
    // Replace placeholders in the default text with actual values
    const localizedText = i18n_default_text.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);

    return localizedText || null;
};

// Mock for useTranslations hook
const useTranslations = () => ({
    localize: jest.fn((text, args) => {
        return text.replace(/{{(.*?)}}/g, (_, match) => args[match.trim()]);
    }),
    currentLang: 'EN',
});

const localize = jest.fn(text => text);

const getAllowedLanguages = jest.fn(() => ({ EN: 'English', VI: 'Tiếng Việt' }));

const initializeI18n = jest.fn(() => {});

export { getAllowedLanguages, initializeI18n, Localize, localize, useTranslations };https://github.com/login?client_id=0120e057bd645470c1ed&return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3D0120e057bd645470c1ed%26code_challenge%3DKLYuew4ZJQvaz21TMjM1tNR-zyITzK_pYamO9KLH6hA%26code_challenge_method%3DS256%26redirect_uri%3Dhttp%253A%252F%252F127.0.0.1%253A62350%252F%26response_type%3Dcode%26scope%3Drepo%2Bgist%2Bworkflow%26state%3D36bf0cdbb48842018b8598b7b119bd15