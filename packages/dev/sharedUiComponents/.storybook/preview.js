export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'normal',
    values: [
      {
        name: 'normal',
        value: '#e0e0e0'
      },
      {
        name: 'light',
        value: '#ffffff'
      },
      {
        name: 'dark',
        value: '#333333'
      }
    ]
  }
}