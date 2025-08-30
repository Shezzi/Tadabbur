# Tadabbur - Quran Guessing Game

A daily challenge game where players guess which Surah (chapter) of the Quran a given Ayah (verse) belongs to.

## 🚀 New Optimized File Structure

The application has been completely restructured for better maintainability, performance, and developer experience:

```
Tadabbur/
├── index.html          # Clean HTML structure
├── css/
│   ├── themes.css      # CSS custom properties (variables)
│   └── styles.css      # Component styles and animations
├── js/
│   ├── app.js          # Main application entry point
│   ├── api.js          # API calls and data fetching
│   ├── game.js         # Core game logic and mechanics
│   ├── state.js        # State management and localStorage
│   ├── ui.js           # UI updates and interactions
│   └── utils.js        # Utility functions and helpers
└── README.md           # This file
```

## ✨ Key Improvements

### 1. **Modular Architecture**
- **Separation of Concerns**: Each file has a single, clear responsibility
- **ES6 Modules**: Modern JavaScript imports/exports for better organization
- **Maintainable Code**: Easier to debug, update, and extend

### 2. **Performance Optimizations**
- **Lazy Loading**: Data is loaded only when needed
- **Efficient DOM Queries**: Cached DOM elements reduce lookups
- **Optimized Event Handling**: Better event delegation and management

### 3. **Code Quality**
- **Readable Functions**: All functions are properly formatted and documented
- **Consistent Naming**: Clear, descriptive function and variable names
- **Error Handling**: Comprehensive error handling throughout the application

### 4. **Developer Experience**
- **Easy Debugging**: Clear file structure makes issues easier to locate
- **Simple Testing**: Individual modules can be tested independently
- **Scalable**: Easy to add new features or modify existing ones

## 🔧 How to Use

### Local Development
1. **Clone/Download** the repository
2. **Open** `index.html` in a modern web browser
3. **Or** serve locally using a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   ```

### GitHub Pages Deployment
1. **Push** all files to your GitHub repository
2. **Enable** GitHub Pages in repository settings
3. **Select** source branch (usually `main`)
4. **Access** your site at `https://username.github.io/repository-name`

## 📁 File Descriptions

### `index.html`
- Clean, semantic HTML structure
- Proper meta tags and accessibility attributes
- Module-based JavaScript loading

### `css/themes.css`
- CSS custom properties for consistent theming
- Light/dark mode color variables
- Easy theme customization

### `css/styles.css`
- Component-specific styling
- Animations and transitions
- Responsive design utilities

### `js/app.js`
- Application entry point
- Event listener initialization
- Main initialization logic

### `js/api.js`
- External API communication
- Data fetching and caching
- Error handling for network requests

### `js/game.js`
- Core game mechanics
- Challenge logic and scoring
- Game state management

### `js/state.js`
- Application state management
- localStorage operations
- Statistics tracking

### `js/ui.js`
- User interface updates
- DOM manipulation
- User interaction handling

### `js/utils.js`
- Helper functions
- Theme management
- Common utilities

## 🎯 Game Features

- **Three Difficulty Levels**: Easy (Juz 30), Medium (Surahs 36-114), Hard (Full Quran)
- **Daily Challenges**: Deterministic daily challenges for all users
- **Hint System**: Progressive hints for Easy/Medium difficulties
- **Statistics Tracking**: Win rates, streaks, and guess distribution
- **Multiple Scripts**: Uthmani and Indo-Pak Arabic scripts
- **Audio Recitation**: Multiple reciter options
- **Responsive Design**: Works on desktop and mobile devices

## 🌟 Benefits of the New Structure

1. **Maintainability**: Each file has a clear purpose and responsibility
2. **Performance**: Better caching and loading strategies
3. **Scalability**: Easy to add new features or modify existing ones
4. **Debugging**: Issues are easier to locate and fix
5. **Collaboration**: Multiple developers can work on different modules
6. **Testing**: Individual modules can be tested independently
7. **Documentation**: Clear structure makes the code self-documenting

## 🔄 Migration from Old Structure

If you're migrating from the old `Test.html` file:

1. **Backup** your original `Test.html` file
2. **Replace** it with the new `index.html`
3. **Create** the new directory structure
4. **Copy** all the new files
5. **Test** thoroughly to ensure everything works
6. **Deploy** when satisfied

## 🐛 Troubleshooting

### Common Issues

1. **Module Loading Errors**: Ensure you're serving files via HTTP (not file://)
2. **CORS Issues**: Use a local development server
3. **Missing Functions**: Check that all imports/exports are correct
4. **Styling Issues**: Verify CSS files are loading properly

### Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **ES6 Modules**: Required for the new structure
- **CSS Custom Properties**: Used for theming

## 📝 Contributing

The new structure makes it much easier to contribute:

1. **Fork** the repository
2. **Create** a feature branch
3. **Modify** the relevant module(s)
4. **Test** your changes
5. **Submit** a pull request

## 🎉 Conclusion

This restructured version maintains all the original functionality while providing a much better foundation for future development. The code is now more maintainable, performant, and developer-friendly.

For any questions or issues, please refer to the code comments or create an issue in the repository.
