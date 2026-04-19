const fs = require('fs');
const path = require('path');

function filenameToConfigKey(filename) {
  const name = path.basename(filename, path.extname(filename));

  const base = name.endsWith('Widget') ? name.slice(0, -6) : name;

  return base
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function getComponentNameFromContent(content, fileName) {
  const exportDefaultMatch = content.match(/export\s+default\s+(\w+)/);
  if (exportDefaultMatch) return exportDefaultMatch[1];

  const constExportMatch = content.match(/const\s+(\w+)\s+=.*?\nexport\s+default\s+\1/);
  if (constExportMatch) return constExportMatch[1];

  const baseName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
  if (!baseName.toLowerCase().includes('widget')) {
    return baseName + 'Widget';
  }
  return baseName;
}

function generateWidgetRegistry() {
  const widgetsDir = './components/widgets';
  if (!fs.existsSync(widgetsDir)) {
    console.error(`Widgets directory not found: ${widgetsDir}`);
    return;
  }

  const files = fs.readdirSync(widgetsDir);
  const widgetImports = [];
  const widgetRegistry = {};
  const widgetMetadata = {};
  const newWidgetKeys = [];

  files.forEach(file => {
    if ((file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.startsWith('_') && !file.startsWith('.')) {

      const widgetName = path.basename(file, path.extname(file));
      const configKey = filenameToConfigKey(file);

      const filePath = path.join(widgetsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const componentName = getComponentNameFromContent(fileContent, widgetName);

      widgetImports.push(`import ${componentName} from '@/components/widgets/${widgetName}';`);
      widgetRegistry[configKey] = componentName;

      newWidgetKeys.push(configKey);

      const defaultNames = {
        music: 'Music', weather: 'Weather', uv: 'UV Index',
        precipitation: 'Rain Alert', date: 'Date',
        yearProgress: 'Year Progress', commuter: 'Commuter',
        rain: 'Rain Alert', 'energy-price': 'Energy Price'

      };
      const defaultDescriptions = {
        music: 'AirPlay music player',
        weather: 'Current weather conditions',
        uv: 'Shows when UV index > 4',
        precipitation: 'Shows when rain expected soon',
        date: 'Current date display',
        yearProgress: 'Apple Watch style year progress',
        commuter: 'Morning/evening transit info',
        rain: 'Shows when rain expected soon',
        el: 'Current electricity price in SE3'

      };

      widgetMetadata[configKey] = {
        name: defaultNames[configKey] || configKey.replace(/-/g, ' ').replace(/^./, str => str.toUpperCase()),
        description: defaultDescriptions[configKey] || `Description for ${configKey} widget`
      };
    }
  });

  const registryCode = `
${widgetImports.join('\n')}

export const WIDGET_REGISTRY = {
${Object.entries(widgetRegistry).map(([key, value]) => `  '${key}': ${value}`).join(',\n')}
};

export const WIDGET_METADATA = {
${Object.entries(widgetMetadata).map(([key, value]) => `  '${key}': { name: '${value.name}', description: '${value.description}' }`).join(',\n')}
};`;

  const utilsDir = './utils';
  if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });
  fs.writeFileSync('./utils/widgetRegistry.js', registryCode);
  console.log(`✅ Widget registry generated with ${Object.keys(widgetRegistry).length} widgets!`);

  updateConfigWithNewWidgets(newWidgetKeys);

  Object.entries(widgetRegistry).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}

function updateConfigWithNewWidgets(newKeys) {

  const configPath = path.resolve(__dirname, '../config.json');

  if (!fs.existsSync(configPath)) {
    console.log(`⚠️ Config file not found at ${configPath}, skipping config update`);
    return;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    let config;
    let isJson = true;

    if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {

      const module = { exports: {} };
      const wrapped = `(function(module, exports) { ${configContent} })(module, module.exports);`;
      config = module.exports.default || module.exports;
      isJson = false;
    } else {
      config = JSON.parse(configContent);
    }

    if (!config.widgets) config.widgets = {};

    let addedCount = 0;
    newKeys.forEach(key => {
      if (!config.widgets[key]) {
        config.widgets[key] = {
          enabled: true,
          timeSlots: []

        };
        addedCount++;
        console.log(`➕ Added config entry for '${key}'`);
      }
    });

    if (addedCount === 0) {
      console.log(`✅ All ${newKeys.length} widgets already exist in config`);
      return;
    }

    if (isJson) {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    } else {

      const newConfigStr = `export default ${JSON.stringify(config, null, 2)}`;
      fs.writeFileSync(configPath, newConfigStr + '\n');
    }

    console.log(`✅ Config updated with ${addedCount} new widget(s)!`);

  } catch (error) {
    console.error(`❌ Failed to update config: ${error.message}`);
    console.log('💡 Tip: Manually add to your config:');
    newKeys.forEach(key => {
      console.log(`    "${key}": { "enabled": true, "timeSlots": [] }`);
    });
  }
}

try {
  generateWidgetRegistry();
} catch (error) {
  console.error('❌ Error generating widget registry:', error.message);
  process.exit(1);
}