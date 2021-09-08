const {resolve} = require('path'); //provides absolute paths
const path = require('path'); //provides absolute paths
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {removeEmpty} = require('webpack-config-utils');
const {LoaderOptionsPlugin, DefinePlugin, optimize: {LimitChunkCountPlugin}, debug} = require('webpack');
const WorkboxPlugin = require('workbox-webpack-plugin');
const createConfig = require("./config.js");
const childProcess = require('child_process');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const CordovaPlugin = require('webpack-cordova-plugin');
const { merge:webpackMerge } = require('webpack-merge');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const RobotstxtPlugin = require('robotstxt-webpack-plugin');
const S3Plugin = require('webpack-s3-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const NodePolyFillPlugin = require("node-polyfill-webpack-plugin");

process.traceDeprecation = true;
const indexHtml = 'index.html';

module.exports = (env, argv) =>
  webpackpack({
    partialsParam: myUtils(env, argv),
    partials: [
      base,
      elmSupport,
      devServer,
      sourceMaps,
      favicons,
      pwaManifest,
      envVars,
      styles,
      fileAssets,
      offline,
      extraLoadersOptions,
      robotsTxt,
      chunksConfig,
      cordova,
      // webPublish,
      errorReporting,
      // bundleVisualiser,
      // profiling,
    ]
  });


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function base({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  const chunkOrder = ['splash', 'app'];
  return {
    mode: ifActiveDevelopment('development', 'production'),
    context: resolve('src'),
    entry: {
      app: [
        'blueimp-canvas-to-blob',
        './scripts/main.ts',
        './styles/main.scss',
      ]
    },
    output: {
      path: resolve('builds/web'),
      publicPath: '/', //used to be: http://localhost:8080/ -- http://stackoverflow.com/a/34133809/592641 -- kinda not needed now
      filename: ifOptimized('[name].[contenthash].js', '[name].js'),
      chunkFilename: ifOptimized('[id].[contenthash].js', '[id].js'),
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
    module: {
      rules: [
        loader({
          test: /\.ts$/,
          use: removeEmpty([
            {
              loader: 'ts-loader',
              options: {transpileOnly: false}
            },
          ])
        }),
        loader({
          test: /\.ejs$/,
          use: {
            loader: 'ejs-compiled-loader',
            options: {
              htmlmin: true,
              htmlminOptions: {
                removeComments: true,
              },
            },
          }
        })
      ],
    },
    plugins: [
      new NodePolyFillPlugin(),
      new HtmlWebpackPlugin({
        inject: false,
        template: './app.ejs',
        filename: indexHtml,
        // favicon: resolve('cordova-prod/graphics/icon-android.png'),
        chunksSortMode: (a, b) => chunkOrder.indexOf(a) <= chunkOrder.indexOf(b) ? -1 : 1,
        env: {isProd, isWeb, isHybrid},
        config: createConfig(ifWeb, ifHybrid, ifProd, ifDev)
      }),
      // new PreloadWebpackPlugin({
      //   rel: 'prefetch'
      // }),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: {
              comments: false,
            },
          },
        }),
      ],
    }
  };
}

function elmSupport({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment, isOptimized}) {
  return {
    resolve: {
      alias: {
        MainModule: resolve('src/scripts/Main.elm')
      }
    },
    module: {
      rules: removeEmpty([
        loader({
          test: /\.elm$/,
          use: removeEmpty([
            {
              loader: path.join(__dirname, './ElmOptimizationsPlugin'),
              /** @type ElmOptimizationsPluginOptions */
              options: {
                htmlLazy: true,
              }
            },
            ifOptimized({loader: 'elm-assets-loader', options: {module: 'Assets', tagger: 'AssetPath'}}),
            ({ loader: 'elm-asset-webpack-loader' }),
            ifActiveDevelopment({ loader: 'elm-hot-webpack-loader' }),
            {
              loader: 'elm-webpack-loader',
              options: {
                debug: false,
                // runtimeOptions: "-A128m -H128m -n8m",
                optimize: isOptimized,
              }
            },
          ])
        }),
      ])
    }
  };
}

function devServer({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    devServer: {
      host: '0.0.0.0', //some extra discussion on all-host binding: https://github.com/webpack/webpack-dev-server/issues/400#issuecomment-256783529
      port: '8080',
      historyApiFallback: true, //pushState
      disableHostCheck: true,
      overlay: true,
      publicPath: '/',
      contentBase: ifWeb('./src'), //https://stackoverflow.com/a/33384364/592641
      stats: {
        colors: true
      },
      watchOptions: {
        ignored:[ '**/node_modules/', '**/elm-stuff'],
        // poll: 5000,
      }
    }
  };
}

function sourceMaps({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    devtool: ifOptimized('source-map', 'eval-cheap-module-source-map'),
  };
}

function favicons({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return ifOptimized(ifWeb({
    plugins: [
      // https://github.com/jantimon/favicons-webpack-plugin
      // https://github.com/itgalaxy/favicons#usage
      new FaviconsWebpackPlugin({
        logo: resolve(ifDev('./icon-masked-dev.png', './icon-masked-prod.png')),
        inject: true,

        // Enable caching and optionally specify the path to store cached data
        // Note: disabling caching may increase build times considerably
        cache: true,
        // Override the publicPath option usually read from webpack configuration
        // publicPath: '/static',

        // The directory to output the assets relative to the webpack output dir.
        // Relative string paths are allowed here ie '../public/static'. If this
        // option is not set, `prefix` is used.
        // outputPath: '/public/static',

        // Prefix path for generated assets
        // prefix: 'assets/',
        prefix: 'icons-[contenthash]/',
        // Favicons configuration options (see below)
        favicons: {
          // appName: 'my-app',
          // appDescription: 'My awesome App',
          // developerName: 'Me',
          // developerURL: null, // prevent retrieving from the nearest package.json
          // background: '#ddd',
          // theme_color: '#333',
          icons: {
            android: false,              // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            appleIcon: true,            // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            appleStartup: false,         // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            coast: false,                // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            favicons: true,              // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            firefox: false,              // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            windows: false,              // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
            yandex: false,
          },
        },
      })
    ]
  }));
}

function pwaManifest({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  const config = createConfig(ifWeb, ifHybrid, ifProd, ifDev);
  return ifWeb({
    plugins: [
      new WebpackPwaManifest({
        filename: 'manifest.json',
        name: config.appName,
        description: config.appDescription,
        short_name: config.appShortName,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: config.appThemeColor,
        theme_color: config.appThemeColor,
        icons: ifOptimized([
          {
            src: resolve(config.maskedIcon),
            sizes: [36, 48, 72, 96, 144, 192, 256, 384, 512]
          },
          {
            purpose: 'maskable',
            src: resolve(config.maskableIcon),
            sizes: [36, 48, 72, 96, 144, 192, 256, 384, 512],
          }
        ]),
        prefer_related_applications: false,
        related_applications: [
          {
            platform: 'play',
            url: config.googlePlayStoreUrl,
            id: config.googlePlayStoreIdentifier,
          },
          {
            platform: 'itunes',
            url: config.appleAppStoreUrl,
            id: config.appleAppStoreIdentifier,
          }
        ],
        // lang: 'mk-MK', //todo: base on domain target
        dir: 'auto',
      })
    ]
  });
}

function envVars({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment, isOptimized, isActiveDevelopment}) {
  const config = createConfig(ifWeb, ifHybrid, ifProd, ifDev);
  return {
    plugins: [
      new DefinePlugin({
        'process.env': {
          commit: JSON.stringify(releaseIdentifier(ifWeb)),
          isProd, isDev, isWeb, isHybrid, isOptimized, isActiveDevelopment,
          config: JSON.stringify(config),
          audience: JSON.stringify(audience),
          platform: JSON.stringify(platform),
        },
      })
    ]
  };
}

function styles({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment, isActiveDevelopment}) {
  return {
    module: {
      rules: [
        loader({
          test: /main.scss$/,
          use: ifOptimized(
            [
              {loader: MiniCssExtractPlugin.loader},
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true,
                },
              },
              'sass-loader',
              'import-glob',
            ],
            [
              'style-loader',
              'css-loader',
              'sass-loader',
              'import-glob'
            ]
          )
        }),
        ({
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ]
        }),
      ]
    },
    plugins: removeEmpty([
      new MiniCssExtractPlugin({
        filename: ifOptimized('[name].[contenthash].css', '[name].css'),
      }),
      // ifOptimized(new PurgecssPlugin({ // todo: doesn't work for this: `"h" ++ String.fromInt heightUnits`
      //   paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`,  { nodir: true }),
      //   whitelistPatterns: [/icon-/],
      // })),
    ]),
    optimization: {
      minimizer: removeEmpty([
        ifOptimized(new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              }
            ]
          }
        })),
      ]),
    }
  };
}


function fileAssets({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    module: {
      rules: [
        {
          test: /\.(png|jpg|jpeg|gif|eot|svg|ttf|woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$)/,
          use: ifOptimized(
            [
              {loader: 'file-loader', options: {name: '[path][name].[contenthash].[ext]', context: resolve('src'), esModule: false}},
              {loader: 'image-webpack-loader', options: {name: '[path][name].[contenthash].[ext]', context: resolve('src')}}
            ],
            [
              {loader: 'file-loader', options: {name: '[path][name].[ext]', context: resolve('src'), esModule: false}},
              {loader: 'image-webpack-loader', options: {name: '[path][name].[ext]', context: resolve('src')}}
            ]
          )
        }
      ]
    }
  };
}

function offline({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment, isOptimized}) {
  return ifOptimized(ifWeb({
    plugins: [
      new WorkboxPlugin.InjectManifest({
        swSrc: './scripts/sw.ts',
        compileSrc: true,
        swDest: 'sw.js',
        exclude: [ /\.(?:ico|map|txt|json)$/,
          /icon_[a-zA-Z0-9_\-.]+\.png$/,
          /assets\/images\/rich-share[a-zA-Z0-9_\-.]*\.jpg$/,
          /icons-[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\.png$/,
        ],
      }),
    ],
  }));
}



function cordova({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    plugins: removeEmpty([
      ifHybrid(new CordovaPlugin({
        config: 'cordova/config.xml',  // Location of Cordova' config.xml (will be created if not found)
        src: indexHtml,           // Set entry-point of cordova in config.xml
        platform: 'android',       // (or 'android') // Set `webpack-dev-server` to correct `contentBase` to use Cordova plugins.
        version: false,          // Set config.xml' version. (true = use version from package.json)
      }))
    ])
  };
}

function errorReporting({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return ifWeb(ifOptimized({
    plugins: [
      new SentryCliPlugin({
        include: '.',
        ignoreFile: '.gitignore',
        ignore: ['node_modules', 'webpack.config.babel.js', 'cordova', 'cordova-prod'],
      })
    ]
  }));
}

function chunksConfig({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return ifOptimized({
    plugins: [
      new LimitChunkCountPlugin({
        maxChunks: 3
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'initial',
        // minSize: 0,
        // maxSize: 30,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: '~',
        cacheGroups: {
          workboxExtra: {
            test: 'workboxExtra',
            name: 'workboxExtra',
            chunks: 'all',
          },
          vendors: false,
          default: false,
          // vendors: {
          //   test: /[\\/]node_modules[\\/]/,
          //   priority: -10,
          // },
          // default: {
          //   minChunks: 2,
          //   priority: -20,
          //   reuseExistingChunk: true
          // }
        }
      }
    }
  });
}
function webPublish({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized}) {
  return ifOptimized(ifWeb({
    plugins: [
      new S3Plugin({
        exclude: /^.*\.map$/,
        s3Options: {
          accessKeyId: ifDev('', ''),
          secretAccessKey: ifDev('', ''),
          region: 'us-east-1'
        },
        s3UploadOptions: {
          Bucket: ifDev('', ''),
          CacheControl:
            fileName => fileName === indexHtml ?
              'public, max-age=3600, s-maxage=31536000' :
              'public, max-age=31536000',
        },
        cloudfrontInvalidateOptions: {
          DistributionId: ifDev('', ''),
          Items: ['/' + indexHtml, '/sw.js', '/manifest.json', '/robots.txt']
        },
      })
    ]
  }));
}

function extraLoadersOptions({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    plugins: [
      new LoaderOptionsPlugin({
        options: {
          context: __dirname,
        }
      })
    ]
  };
}
function robotsTxt({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    plugins: [
      new RobotstxtPlugin({
        sitemap: ifDev('https://gotaguydev.com/sitemap.xml', 'https://mojcoek.mk/sitemap.xml'),
        host: ifDev('https://gotaguydev.com','https://mojcoek.mk'),
        policy: ifDev([
          {
            userAgent: '*',
            disallow: '/',
          }
        ])
      })
    ]
  };
}

function bundleVisualiser({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    plugins: removeEmpty([
      new BundleAnalyzerPlugin({
        analyzerMode: 'static'
      })
      // new Visualizer()
    ])
  };
}


function profiling({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    plugins: removeEmpty([
      new debug.ProfilingPlugin({
        outputPath: 'builds/profileEvents.json'
      })
    ])
  };
}





function SAMPLE({audience, platform, isDev, isProd, isWeb, isHybrid, ifDev, ifProd, ifWeb, ifHybrid, ifOptimized, ifActiveDevelopment}) {
  return {
    module: {
      rules: [

      ]
    },
    plugins: removeEmpty([

    ])
  };
}





////////////////////////////////////////////////  TOOLS   ////////////////////////////////////////////////

function releaseIdentifier(ifWeb) {
  return ifWeb('web: ', 'hybrid: ') + childProcess.execSync('git rev-parse --short HEAD').toString().trim();
}

function webpackpack({partialsParam, partials}) {
  const config = partials.reduce((acc, partial) => webpackMerge(acc, partial(partialsParam) || {}), {});
  console.log('\n', config, '\n\n\n');
  return config;
  // return (new SpeedMeasurePlugin).wrap(config);
}


function loader(config) {
  return Object.assign(config, {
    exclude: [/node_modules/, /elm-stuff/],
  });
}

function myUtils({audience, platform, optimized}, argv) {
  ensureEnvValidity(audience, platform);
  const theMap = {
    Dev: audience === 'dev',
    Prod: audience === 'prod',
    Web: platform === 'web',
    Hybrid: platform === 'hybrid',
    ActiveDevelopment: optimized !== 'yes',
    Optimized: optimized === 'yes',
  };

  return Object.keys(theMap).reduce((memo, key) => {
    memo['is' + key] = theMap[key];
    memo['if' + key] = ifThen.bind(null, theMap[key]);
    return memo;
  }, {audience, platform});
}

function ifThen(condition, trueVal, falseVal) {
  return condition ? trueVal : falseVal;
}

function ensureEnvValidity(audience, platform) {
  const validAudience = ['dev', 'prod'];
  const validPlatform = ['web', 'hybrid'];
  if (validAudience.indexOf(audience) === -1) {
    throw '\nEnvironment validity error: Unexpected audience: ' + audience + '\nMust be one of: ' + validAudience.join(', ') + '\n\n';
  }
  if (validPlatform.indexOf(platform) === -1) {
    throw '\nEnvironment validity error: Unexpected platform: ' + platform + '\nMust be one of: ' + validPlatform.join(', ') + '\n\n';
  }
}
