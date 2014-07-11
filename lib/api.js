var config = require('./config')
,   request = require('request')
,   ERRORS = config.ERRORS
,   format = require('util').format
,   xtend = require('xtend')
,   utils = require('./utils')
,   without = utils.without
,   each = utils.each
,   normalize = utils.normalize
,   countTokens = utils.countTokens
,   Chain = require('./chain')

function TmdbApi(key){
    if(!key) throw new Error(ERRORS.KEY_MISSING)
    this.apiKey = key
    //TODO: Make this less terrible
    createMethods('movie', without('movie',Object.keys(config.endpoints.movie)).map(function(val){
        return {name : val, uri : config.endpoints.movie[val] }
    }))
    createMethods('collection', without('collection',Object.keys(config.endpoints.collection)).map(function(val){
        return {name : val, uri : config.endpoints.collection[val] }
    }))
    createMethods('company', without('company',Object.keys(config.endpoints.company)).map(function(val){
        return {name : val, uri : config.endpoints.company[val] }
    }))
    this.changes = genericTyped.bind(this, config.endpoints.changes.changes, 'movie')
}

/**
    Genres
    Returns the list of movie genres.
    @sig Genres(function(err,data,response))
    @sig Genres([Integer] Id,function(err,data,response))
    @sig Genres([Integer] Id, [Object] Options, function(err,data,response)) 
    @Desc Fetch all movies with the specified genre.(Note this acheives the same effect as Genres(Integer))
*/
TmdbApi.prototype.genres = function(id,opts,callback) {
    var args = Array.prototype.slice.call(arguments)
    if(args.length === 1){
        callback = id
        id = null
    }else if(args.length === 2){
        callback = opts
        opts = {}
    }

    if(null == id){
        return this._execRequest({
            uri : config.baseUrl + config.endpoints.genres.genreList
        }, callback)
    }
    this._execRequest({
        uri : config.baseUrl + format(config.endpoints.genres.movies, id),
        qs : opts
    }, callback)
}

/**
    Collection
    @Desc Chainable. Get the collection the specific collection id belongs to.
    @sig collection([Integer] id, [Object] opts, function(err,data,response))
*/
TmdbApi.prototype.collection = function(id,opts,callback) {
    return new Chain(this
        , this.formUri(format(config.endpoints.collection.collection, id))
        , without('collection', Object.keys(config.endpoints.collection))
        , opts
        , callback)
}

/**
    Movie
    @Desc Chainable. Get the movies info
    @sig collection([Integer] id, [Object] opts, function(err,data,response))
*/
TmdbApi.prototype.movie = function(id,opts,callback) {
    return new Chain(this
        ,this.formUri(format(config.endpoints.movie.movie,id))
        ,without('movie', Object.keys(config.endpoints.movie))
        ,opts
        ,callback)
}

/**
    Company
    @Desc Chainable. Get company info
    @sig collection([Integer] id, [Object] opts, function(err,data,response))
*/
TmdbApi.prototype.company = function(id,opts,callback) {
    return new Chain(this
        ,this.formUri(format(config.endpoints.company.company,id))
        ,without('company', Object.keys(config.endpoints.company))
        ,opts
        ,callback)
}

function createMethods(prefix,methodList) {
    methodList.forEach(function(val){
        this[prefix+normalize(val.name)] = genericToken.bind(this,val.uri); 
    },this)
}

function genericChain(uri,methodList,id,opts,callback){
    return new Chain(this
        ,   methodList
        ,   opts
        ,   callback)
}

function genericTyped(uri,defaultType,type,opts,callback) {
    var args = Array.prototype.slice.call(arguments)
    if(typeof type === 'function'){
        callback = type
        type = defaultType
        opts = {}
    }else if(typeof opts === 'function'){
        callback = opts
        opts = {}
    }else if(typeof type === 'object'){
        callback = opts
        opts = type
        type = defaultType
    }
    return this._execRequest({
        uri : config.baseUrl + format(uri, type),
        qs : opts
    }, callback)
}

function genericToken(uri) {
    var args = Array.prototype.slice.call(arguments)
    ,   callback = args.pop()
    ,   opts = args.pop()
    ,   tokens = args.slice(0)
    if(typeof opts !== 'object'){
        tokens.push(opts)
        opts = {}
    }
    tokens.unshift(uri)
    var uri = this.formUri(format.apply(null,tokens))
        this._execRequest({
            uri : uri,
            qs : opts
        }, callback)
}



TmdbApi.prototype.formUri = function(uri) {
    return config.baseUrl + uri
}

TmdbApi.prototype._execRequest = function(opts,callback) {
    if(null == opts.qs) opts.qs = {}
    if(null == opts.method) opts.method = 'GET'
    opts.qs.api_key = this.apiKey
    request(opts,function(err,body,response){
        if(err) return callback(err,response, body, opts, this)
        return callback(err,JSON.parse(response),body, opts, this)
    })
}




module.exports = TmdbApi
