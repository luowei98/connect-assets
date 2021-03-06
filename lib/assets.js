// Generated by CoffeeScript 1.3.3
(function() {
  var BEFORE_DOT, ConnectAssets, EXPLICIT_PATH, REMOTE_PATH, Snockets, connectCache, crypto, cssCompilers, cssExts, exports, extend, fs, getExt, jsCompilers, libs, md5Filenamer, mkdirRecursive, parse, path, stripExt, timeEq,
    __slice = [].slice;

  connectCache = require('connect-file-cache');

  Snockets = require('snockets');

  crypto = require('crypto');

  fs = require('fs');

  path = require('path');

  parse = require('url').parse;

  libs = {};

  jsCompilers = Snockets.compilers;

  extend = function() {
    var dest, k, obj, objs, v, _i, _len;
    dest = arguments[0], objs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = objs.length; _i < _len; _i++) {
      obj = objs[_i];
      for (k in obj) {
        v = obj[k];
        dest[k] = v;
      }
    }
    return dest;
  };

  module.exports = exports = function(options) {
    var connectAssets, _base, _base1, _ref, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9,
      _this = this;
    if (options == null) {
      options = {};
    }
    if (connectAssets) {
      return connectAssets;
    }
    if ((_ref = options.src) == null) {
      options.src = 'assets';
    }
    if ((_ref1 = options.helperContext) == null) {
      options.helperContext = global;
    }
    if (process.env.NODE_ENV === 'production') {
      if ((_ref2 = options.build) == null) {
        options.build = true;
      }
      if ((_ref3 = (_base = cssCompilers.styl).compress) == null) {
        _base.compress = true;
      }
      if ((_ref4 = (_base1 = cssCompilers.less).compress) == null) {
        _base1.compress = true;
      }
    }
    if ((_ref5 = options.servePath) == null) {
      options.servePath = '';
    }
    if ((_ref6 = options.buildDir) == null) {
      options.buildDir = 'builtAssets';
    }
    if ((_ref7 = options.buildFilenamer) == null) {
      options.buildFilenamer = md5Filenamer;
    }
    if ((_ref8 = options.buildsExpire) == null) {
      options.buildsExpire = false;
    }
    if ((_ref9 = options.detectChanges) == null) {
      options.detectChanges = process.env.NODE_ENV !== 'production';
    }
    if ((_ref10 = options.minifyBuilds) == null) {
      options.minifyBuilds = true;
    }
    if ((_ref11 = options.pathsOnly) == null) {
      options.pathsOnly = false;
    }
    libs.stylusExtends = (_ref12 = options.stylusExtends) != null ? _ref12 : options.stylusExtends = function() {
      return {};
    };
    jsCompilers = extend(jsCompilers, options.jsCompilers || {});
    connectAssets = module.exports.instance = new ConnectAssets(options);
    connectAssets.createHelpers(options);
    return connectAssets.cache.middleware;
  };

  ConnectAssets = (function() {

    function ConnectAssets(options) {
      this.options = options;
      this.cache = connectCache();
      this.snockets = new Snockets({
        src: this.options.src
      });
      this.cssSourceFiles = {};
      this.compiledCss = {};
      this.buildFilenames = {};
      this.cachedRoutePaths = {};
    }

    ConnectAssets.prototype.createHelpers = function() {
      var context, expandRoute, srcIsRemote,
        _this = this;
      context = this.options.helperContext;
      srcIsRemote = this.options.src.match(REMOTE_PATH);
      expandRoute = function(shortRoute, ext, rootDir) {
        if (rootDir[0] === '/') {
          rootDir = rootDir.slice(1);
        }
        if (shortRoute.match(EXPLICIT_PATH)) {
          if (!shortRoute.match(REMOTE_PATH)) {
            if (shortRoute[0] === '/') {
              shortRoute = shortRoute.slice(1);
            }
          }
        } else {
          if (rootDir !== '') {
            shortRoute = rootDir + '/' + shortRoute;
          }
        }
        if (ext && shortRoute.indexOf(ext, shortRoute.length - ext.length) === -1) {
          shortRoute += ext;
        }
        return shortRoute;
      };
      context.css = function(route) {
        route = expandRoute(route, '.css', context.css.root);
        if (!route.match(REMOTE_PATH)) {
          route = _this.options.servePath + _this.compileCSS(route);
        }
        if (_this.options.pathsOnly) {
          return route;
        }
        return '<link rel="stylesheet" href="' + route + '" />';
      };
      context.css.root = 'css';
      context.js = function(route, routeOptions) {
        var loadingKeyword, p, r, routes;
        loadingKeyword = '';
        route = expandRoute(route, '.js', context.js.root);
        if (route.match(REMOTE_PATH)) {
          routes = [route];
        } else if (srcIsRemote) {
          routes = ["" + _this.options.src + "/" + route];
        } else {
          routes = (function() {
            var _i, _len, _ref, _results;
            _ref = this.compileJS(route);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              p = _ref[_i];
              _results.push(this.options.servePath + p);
            }
            return _results;
          }).call(_this);
        }
        if (_this.options.pathsOnly) {
          return routes;
        }
        if ((routeOptions != null) && _this.options.build) {
          if (routeOptions.async != null) {
            loadingKeyword = 'async ';
          }
          if (routeOptions.defer != null) {
            loadingKeyword = 'defer ';
          }
        }
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = routes.length; _i < _len; _i++) {
            r = routes[_i];
            _results.push('<script ' + loadingKeyword + 'src="' + r + '"></script>');
          }
          return _results;
        })()).join('\n');
      };
      context.js.root = 'js';
      context.img = function(route) {
        var routes;
        route = expandRoute(route, null, context.img.root);
        if (route.match(REMOTE_PATH)) {
          routes = route;
        } else if (srcIsRemote) {
          route = "" + _this.options.src + "/" + route;
        } else {
          route = _this.options.servePath + _this.cacheImg(route);
        }
        return route;
      };
      return context.img.root = 'img';
    };

    ConnectAssets.prototype.cacheImg = function(route) {
      var alreadyCached, buildPath, cacheFlags, filename, img, mtime, sourcePath, stats, _ref;
      if (!this.options.detectChanges && this.cachedRoutePaths[route]) {
        return this.cachedRoutePaths[route];
      }
      sourcePath = route;
      try {
        stats = fs.statSync(this.absPath(sourcePath));
        if (timeEq(mtime, (_ref = this.cache.map[route]) != null ? _ref.mtime : void 0)) {
          alreadyCached = true;
        } else {
          mtime = stats.mtime;
          img = fs.readFileSync(this.absPath(sourcePath));
        }
        if (alreadyCached && this.options.build) {
          filename = this.buildFilenames[sourcePath];
          return "/" + filename;
        } else if (alreadyCached) {
          return "/" + route;
        } else if (this.options.build) {
          filename = this.options.buildFilenamer(route, getExt(route));
          this.buildFilenames[sourcePath] = filename;
          cacheFlags = {
            expires: this.options.buildsExpire,
            mtime: mtime
          };
          this.cache.set(filename, img, cacheFlags);
          if (this.options.buildDir) {
            buildPath = path.join(process.cwd(), this.options.buildDir, filename);
            mkdirRecursive(path.dirname(buildPath), 0x1ed, function() {
              return fs.writeFile(buildPath, img);
            });
          }
          return this.cachedRoutePaths[route] = "/" + filename;
        } else {
          this.cache.set(route, img, {
            mtime: mtime
          });
          return this.cachedRoutePaths[route] = "/" + route;
        }
      } catch (e) {
        '';

      }
      throw new Error("No file found for route " + route);
    };

    ConnectAssets.prototype.resolveImgPath = function(path) {
      var resolvedPath;
      resolvedPath = path + "";
      resolvedPath = resolvedPath.replace(/url\(|'|"|\)/g, '');
      try {
        resolvedPath = this.options.helperContext.img(resolvedPath);
      } catch (e) {
        console.error("Can't resolve image path: " + resolvedPath);
      }
      return "url('" + resolvedPath + "')";
    };

    ConnectAssets.prototype.fixCSSImagePaths = function(css) {
      var regex;
      regex = /url\([^\)]+\)/g;
      css = css.replace(regex, this.resolveImgPath.bind(this));
      return css;
    };

    ConnectAssets.prototype.compileCSS = function(route) {
      var alreadyCached, buildPath, cacheFlags, css, data, ext, filename, mtime, source, sourcePath, startTime, stats, _i, _len, _ref, _ref1, _ref2, _ref3;
      if (!this.options.detectChanges && this.cachedRoutePaths[route]) {
        return this.cachedRoutePaths[route];
      }
      _ref = ['css'].concat((function() {
        var _results;
        _results = [];
        for (ext in cssCompilers) {
          _results.push(ext);
        }
        return _results;
      })());
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ext = _ref[_i];
        sourcePath = stripExt(route) + ("." + ext);
        try {
          stats = fs.statSync(this.absPath(sourcePath));
          if (ext === 'css') {
            if (timeEq(mtime, (_ref1 = this.cache.map[route]) != null ? _ref1.mtime : void 0)) {
              alreadyCached = true;
            } else {
              mtime = stats.mtime;
              css = (fs.readFileSync(this.absPath(sourcePath))).toString('utf8');
              css = this.fixCSSImagePaths(css);
            }
          } else {
            if (timeEq(stats.mtime, (_ref2 = this.cssSourceFiles[sourcePath]) != null ? _ref2.mtime : void 0)) {
              source = this.cssSourceFiles[sourcePath].data.toString('utf8');
            } else {
              data = fs.readFileSync(this.absPath(sourcePath));
              this.cssSourceFiles[sourcePath] = {
                data: data,
                mtime: stats.mtime
              };
              source = data.toString('utf8');
            }
            startTime = new Date;
            css = cssCompilers[ext].compileSync(this.absPath(sourcePath), source);
            if (css === ((_ref3 = this.compiledCss[sourcePath]) != null ? _ref3.data.toString('utf8') : void 0)) {
              alreadyCached = true;
            } else {
              mtime = new Date;
              this.compiledCss[sourcePath] = {
                data: new Buffer(css),
                mtime: mtime
              };
            }
          }
          if (alreadyCached && this.options.build) {
            filename = this.buildFilenames[sourcePath];
            return "/" + filename;
          } else if (alreadyCached) {
            return "/" + route;
          } else if (this.options.build) {
            filename = this.options.buildFilenamer(route, css);
            this.buildFilenames[sourcePath] = filename;
            cacheFlags = {
              expires: this.options.buildsExpire,
              mtime: mtime
            };
            this.cache.set(filename, css, cacheFlags);
            if (this.options.buildDir) {
              buildPath = path.join(process.cwd(), this.options.buildDir, filename);
              mkdirRecursive(path.dirname(buildPath), 0x1ed, function() {
                return fs.writeFile(buildPath, css);
              });
            }
            return this.cachedRoutePaths[route] = "/" + filename;
          } else {
            this.cache.set(route, css, {
              mtime: mtime
            });
            return this.cachedRoutePaths[route] = "/" + route;
          }
        } catch (e) {
          if (e.code === 'ENOENT') {
            continue;
          } else {
            throw e;
          }
        }
      }
      throw new Error("No file found for route " + route);
    };

    ConnectAssets.prototype.compileJS = function(route) {
      var callback, chain, ext, filename, js, snocketsFlags, sourcePath, _i, _len, _ref,
        _this = this;
      if (!this.options.detectChanges && this.cachedRoutePaths[route]) {
        return this.cachedRoutePaths[route];
      }
      _ref = ['js'].concat((function() {
        var _results;
        _results = [];
        for (ext in jsCompilers) {
          _results.push(ext);
        }
        return _results;
      })());
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ext = _ref[_i];
        sourcePath = stripExt(route) + ("." + ext);
        try {
          if (this.options.build) {
            filename = null;
            callback = function(err, concatenation, changed) {
              var buildDir, buildPath, cacheFlags;
              if (err) {
                throw err;
              }
              if (changed) {
                filename = _this.options.buildFilenamer(route, concatenation);
                _this.buildFilenames[sourcePath] = filename;
                cacheFlags = {
                  expires: _this.options.buildsExpire
                };
                _this.cache.set(filename, concatenation, cacheFlags);
                if (buildDir = _this.options.buildDir) {
                  buildPath = path.join(process.cwd(), buildDir, filename);
                  return mkdirRecursive(path.dirname(buildPath), 0x1ed, function(err) {
                    return fs.writeFile(buildPath, concatenation);
                  });
                }
              } else {
                return filename = _this.buildFilenames[sourcePath];
              }
            };
            snocketsFlags = {
              minify: this.options.minifyBuilds,
              async: false
            };
            this.snockets.getConcatenation(sourcePath, snocketsFlags, callback);
            return this.cachedRoutePaths[route] = ["/" + filename];
          } else {
            chain = this.snockets.getCompiledChain(sourcePath, {
              async: false
            });
            return this.cachedRoutePaths[route] = (function() {
              var _j, _len1, _ref1, _results;
              _results = [];
              for (_j = 0, _len1 = chain.length; _j < _len1; _j++) {
                _ref1 = chain[_j], filename = _ref1.filename, js = _ref1.js;
                filename = stripExt(filename) + '.js';
                this.cache.set(filename, js);
                _results.push("/" + filename);
              }
              return _results;
            }).call(this);
          }
        } catch (e) {
          if (e.code === 'ENOENT') {
            continue;
          } else {
            throw e;
          }
        }
      }
      throw new Error("No file found for route " + route);
    };

    ConnectAssets.prototype.absPath = function(route) {
      if (this.options.src.match(EXPLICIT_PATH)) {
        return path.join(this.options.src, route);
      } else {
        return path.join(process.cwd(), this.options.src, route);
      }
    };

    return ConnectAssets;

  })();

  exports.cssCompilers = cssCompilers = {
    styl: {
      optionsMap: {},
      compileSync: function(sourcePath, source) {
        var callback, options, result, _base, _ref;
        result = '';
        callback = function(err, js) {
          if (err) {
            throw err;
          }
          return result = js;
        };
        libs.stylus || (libs.stylus = require('stylus'));
        libs.bootstrap || (libs.bootstrap = (function() {
          try {
            return require('bootstrap-stylus');
          } catch (e) {
            return function() {
              return function() {};
            };
          }
        })());
        libs.nib || (libs.nib = (function() {
          try {
            return require('nib');
          } catch (e) {
            return function() {
              return function() {};
            };
          }
        })());
        libs.bootstrap || (libs.bootstrap = (function() {
          try {
            return require('bootstrap-stylus');
          } catch (e) {
            return function() {
              return function() {};
            };
          }
        })());
        options = (_ref = (_base = this.optionsMap)[sourcePath]) != null ? _ref : _base[sourcePath] = {
          filename: sourcePath
        };
        libs.stylus(source, options).use(libs.bootstrap()).use(libs.nib()).use(libs.bootstrap()).use(libs.stylusExtends).set('compress', this.compress).set('include css', true).render(callback);
        return result;
      }
    },
    less: {
      optionsMap: {
        optimization: 1,
        silent: false,
        paths: [],
        color: true
      },
      patchLess: function(less) {
        less.Parser.importer = function(file, paths, callback) {
          var data, i, pathname;
          paths.unshift(".");
          i = 0;
          while (i < paths.length) {
            try {
              pathname = path.join(paths[i], file);
              fs.statSync(pathname);
              break;
            } catch (e) {
              pathname = null;
            }
            i++;
          }
          if (!pathname) {
            throw new Error("File " + file + " not found");
          }
          data = fs.readFileSync(pathname, 'utf-8');
          return new less.Parser({
            paths: [path.dirname(pathname)].concat(paths),
            filename: pathname
          }).parse(data, function(e, root) {
            if (e) {
              less.writeError(e);
            }
            return callback(e, root);
          });
        };
        return less;
      },
      compileSync: function(sourcePath, source) {
        var callback, compress, options, result, _ref;
        result = "";
        libs.less || (libs.less = this.patchLess(require('less')));
        options = this.optionsMap;
        options.filename = sourcePath;
        options.paths = [path.dirname(sourcePath)].concat(options.paths);
        compress = (_ref = this.compress) != null ? _ref : false;
        callback = function(err, tree) {
          if (err) {
            throw err;
          }
          return result = tree.toCSS({
            compress: compress
          });
        };
        new libs.less.Parser(options).parse(source, callback);
        return result;
      }
    }
  };

  exports.jsCompilers = jsCompilers;

  BEFORE_DOT = /([^.]*)(\..*)?$/;

  EXPLICIT_PATH = /^\/|\/\/|\w:/;

  REMOTE_PATH = /\/\//;

  getExt = function(filePath) {
    var lastDotIndex;
    if ((lastDotIndex = filePath.lastIndexOf('.')) >= 0) {
      filePath.slice(lastDotIndex + 1);
    }
    return '';
  };

  stripExt = function(filePath) {
    var lastDotIndex;
    if ((lastDotIndex = filePath.lastIndexOf('.')) >= 0) {
      return filePath.slice(0, lastDotIndex);
    } else {
      return filePath;
    }
  };

  cssExts = function() {
    var ext;
    return ((function() {
      var _results;
      _results = [];
      for (ext in cssCompilers) {
        _results.push("." + ext);
      }
      return _results;
    })()).concat('.css');
  };

  timeEq = function(date1, date2) {
    return (date1 != null) && (date2 != null) && date1.getTime() === date2.getTime();
  };

  mkdirRecursive = function(dir, mode, callback) {
    var pathParts;
    pathParts = path.normalize(dir).split(path.sep);
    if (fs.existsSync(dir)) {
      return callback(null);
    }
    return mkdirRecursive(pathParts.slice(0, -1).join(path.sep), mode, function(err) {
      if (err && err.errno !== process.EEXIST) {
        return callback(err);
      }
      fs.mkdirSync(dir, mode);
      return callback();
    });
  };

  exports.md5Filenamer = md5Filenamer = function(filename, code) {
    var ext, hash, md5Hex;
    hash = crypto.createHash('md5');
    hash.update(code);
    md5Hex = hash.digest('hex');
    ext = path.extname(filename);
    return "" + (stripExt(filename)) + "-" + md5Hex + ext;
  };

}).call(this);
