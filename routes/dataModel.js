var express = require('express')
var router = express.Router()
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs')
var path = require('path')
var multipartMiddleware = require('connect-multiparty')()
var {
  signRequired,
  adminRole
} = require('../middleware/auth.js')
var $filterObj = function (target, keys) {
  let result = {}
  keys.forEach(key => {
    result[key] = target[key]
  })
  return result
}

var DataEntity = require('./../app/models/dataModel')
// 数据实体列表查询
router.post('/getDataEntityList', async (req, res, next) => {
  let {
    code,
    name,
    nameEn,
    state = [],
    parentId,
    entityTyep,
    version,
    modelType,
    selectFunction = [],
    creater,
    eos,
    tags,
    curPage = 1,
    pageSize = 20
  } = req.body
  console.log(req.body)
  let conditions = {}
  code && (conditions.code = new RegExp(code, 'i'))
  name && (conditions.name = new RegExp(name, 'i'))
  nameEn && (conditions.nameEn = new RegExp(nameEn, 'i'))
  state.length && (conditions.state = state)
  parentId && (conditions.parentId = new RegExp(parentId, 'i'))
  entityTyep && (conditions.entityTyep = entityTyep)
  version && (conditions.version = version)
  modelType && (conditions.modelType = modelType)
  selectFunction.length && (conditions.selectFunction = selectFunction)
  creater && (conditions.creater = creater)
  // eos && (conditions.eos = eos)
  // tags && (conditions.tags = tags)

  const total = await DataEntity.find().count()
  DataEntity.find(conditions)
    .sort({
      '_id': -1
    })
    .skip(curPage)
    .limit(pageSize)
    .exec()
    .then((DataEntity) => {
      console.log(DataEntity)
      if (DataEntity.length) {
        res.json({
          status: '1',
          result: DataEntity,
          page: {
            total,
            curPage,
            pageSize
          }
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 获取数据实体详情
router.post('/getDataEntityDetail', (req, res, next) => {
  const {id} = req.body
  
  DataEntity.findOne({id})
    .then((result) => {
      if (result) {
        console.log(result)
        let keys = ['id','code','state', 'nameEn', 'name', 'descriptEn', 'descript', 'parentId', 'storeType', 'modelType', 'inherit', 'tableName', 'version', 'creater','creatTime','modifier','modifyTime']
        let data = $filterObj(result, keys)
        res.json({
          status: '1',
          msg: '',
          result: data
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 创建数据实体
router.post('/createDataEntity', (req, res, next) => {
  const {
    nameEn,
    name,
    descriptEn,
    descript,
    parentId,
    modelType,
    storeType,
    inherit,
    tableName,
  } = req.body
  DataEntity.findOne({nameEn}).then((result) => {
    if (result) {
      return res.status(400).json({
        status: '0',
        msg: '产品已存在',
        result: ''
      });
    } else {
      let newDataEntity = {
        nameEn,
        name,
        descriptEn,
        descript,
        parentId,
        modelType,
        storeType,
        inherit,
        tableName
      };

      let DataEntityEntity = new DataEntity(newDataEntity)
      DataEntityEntity.save(err => {
        if (err) {
          res.json({
            status: '0',
            msg: err.message,
            result: ''
          })
        } else {
          res.json({
            status: '1',
            msg: '产品创建成功',
            result: ''
          })
        }
      })
    }
  })
})

// 更新数据实体
router.put('/updateDataEntity', (req, res, next) => {
  let keys = ['id', 'nameEn', 'name', 'descriptEn', 'descript', 'parentId', 'storeType', 'modelType', 'inherit', 'tableName']
  let params = $filterObj(req.body, keys)
  DataEntity.updateOne({id:params.id}, params, (err, result) => {
    if (err) {
      res.status(500).json({
        error: err
      });
    } else {
      DataEntity.findOne({id: params.id})
      .then((result) => {
        if (result) {
          res.json({
            status: '1',
            msg: '更新成功',
            result: result
          })
        } else {
          res.json({
            status: '0',
            msg: '没有查询出数据实体',
            result: ''
          })
        }
      })
      
    }
  })
})

// 删除数据实体
router.delete('/deleteDataEntity', (req, res, next) => {
  const arr = req.body;
  DataEntity.remove({
    _id: {
      $in: arr
    }
  }).then((DataEntity) => {
    if (DataEntity) {
      res.status(200).json({
        status: '1',
        msg: '删除成功',
        result: ''
      })
    } else {
      res.status(400).json({
        status: '0',
        msg: '不存在',
        result: ''
      })
    }
  })
})


// 数据实体基本属性列表查询
router.get('/getDataEntityBaseAttrList', (req, res, next) => {
  DataEntity.find({})
    .sort({
      '_id': -1
    })
    .limit(20)
    .exec()
    .then((DataEntity) => {
      if (DataEntity.length) {
        res.json({
          status: '1',
          msg: '',
          result: DataEntity
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 数据实体基本属性详情查询
router.get('/getDataEntityBaseAttrDetail:id', (req, res, next) => {
  const {id} = req.params;
  DataEntity.find({
    id
    })
    .sort({
      '_id': -1
    })
    .limit(10)
    .exec()
    .then((DataEntity) => {
      if (DataEntity) {
        res.json({
          status: '1',
          msg: '',
          result: DataEntity
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 数据实体基本属性创建
router.post('/createDataEntityBaseAttr', (req, res, next) => {
  const {
    nameEn,
    name,
    descriptEn,
    descript,
    parentId,
    modelType,
    storeType,
    inherit,
    tableName,
    version,
    creater,
    creatTime,
    modifierr,
    modifyTime
  } = req.body
  DataEntity.findOne({nameEn}).then((result) => {
    if (result) {
      return res.status(400).json({
        status: '0',
        msg: '产品已存在',
        result: ''
      });
    } else {
      let newDataEntity = {
        nameEn,
        name,
        descriptEn,
        descript,
        parentId,
        modelType,
        storeType,
        inherit,
        tableName,
        version,
        creater,
        creatTime,
        modifierr,
        modifyTime
      };

      let DataEntityEntity = new DataEntity(newDataEntity)
      DataEntityEntity.save(err => {
        if (err) {
          res.json({
            status: '0',
            msg: err.message,
            result: ''
          })
        } else {
          res.json({
            status: '1',
            msg: '产品创建成功',
            result: ''
          })
        }
      })
    }
  })
})

// 数据实体基本属性更新
router.put('/updateDataEntityBaseAttr', (req, res, next) => {
  const {id} = req.params;
  DataEntity.updateOne({
    id
  }, req.body, (err, DataEntity) => {
    if (err) {
      res.status(500).json({
        error: err
      });
    } else {
      res.status(200).send(DataEntity);
    }
  })
})

// 数据实体基本属性删除
router.delete('/updateDataEntityBaseAttrDelete', (req, res, next) => {
  const {id} = req.params;
  DataEntity.deleteOne({
    _id: id
  }).then((DataEntity) => {
    if (DataEntity) {
      res.status(200).json({
        status: '1',
        msg: '删除成功',
        result: ''
      })
    } else {
      res.status(400).json({
        status: '0',
        msg: '不存在',
        result: ''
      })
    }
  })
})







// 数据实体扩展属性列表查询
router.get('/getDataEntityExtendAttrList', (req, res, next) => {
  DataEntity.find({})
    .sort({
      '_id': -1
    })
    .limit(20)
    .exec()
    .then((DataEntity) => {
      if (DataEntity.length) {
        res.json({
          status: '1',
          msg: '',
          result: DataEntity
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 数据实体基本属性详情查询
router.get('/getDataEntityBaseAttrDetail:id', (req, res, next) => {
  const {id} = req.params;
  DataEntity.find({
    id
    })
    .sort({
      '_id': -1
    })
    .limit(10)
    .exec()
    .then((DataEntity) => {
      if (DataEntity) {
        res.json({
          status: '1',
          msg: '',
          result: DataEntity
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 数据实体基本属性创建
router.post('/createDataEntityExtendAttr', (req, res, next) => {
  const {
    nameEn,
    name,
    descriptEn,
    descript,
    parentId,
    modelType,
    storeType,
    inherit,
    tableName,
    version,
    creater,
    creatTime,
    modifierr,
    modifyTime
  } = req.body
  DataEntity.findOne({nameEn}).then((result) => {
    if (result) {
      return res.status(400).json({
        status: '0',
        msg: '产品已存在',
        result: ''
      });
    } else {
      let newDataEntity = {
        nameEn,
        name,
        descriptEn,
        descript,
        parentId,
        modelType,
        storeType,
        inherit,
        tableName,
        version,
        creater,
        creatTime,
        modifierr,
        modifyTime
      };

      let DataEntityEntity = new DataEntity(newDataEntity)
      DataEntityEntity.save(err => {
        if (err) {
          res.json({
            status: '0',
            msg: err.message,
            result: ''
          })
        } else {
          res.json({
            status: '1',
            msg: '产品创建成功',
            result: ''
          })
        }
      })
    }
  })
})

// 数据实体扩展属性更新
router.put('/updateDataEntityExtendAttr', (req, res, next) => {
  const {id} = req.params;
  DataEntity.updateOne({
    id
  }, req.body, (err, DataEntity) => {
    if (err) {
      res.status(500).json({
        error: err
      });
    } else {
      res.status(200).send(DataEntity);
    }
  })
})

// 数据实体基本属性删除
router.delete('/updateDataEntityExtendAttrDelete', (req, res, next) => {
  const {id} = req.params;
  DataEntity.deleteOne({
    _id: id
  }).then((DataEntity) => {
    if (DataEntity) {
      res.status(200).json({
        status: '1',
        msg: '删除成功',
        result: ''
      })
    } else {
      res.status(400).json({
        status: '0',
        msg: '不存在',
        result: ''
      })
    }
  })
})



// 数据实体父模型属性列表查询
router.get('/getDataEntityParentAttrList', (req, res, next) => {
  DataEntity.find({})
    .sort({
      '_id': -1
    })
    .limit(20)
    .exec()
    .then((DataEntity) => {
      if (DataEntity.length) {
        res.json({
          status: '1',
          msg: '',
          result: DataEntity
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})

// 数据实体父模型属性详情查询
router.get('/getDataEntityParentAttrDetail:id', (req, res, next) => {
  const {id} = req.params;
  DataEntity.find({
    id
    })
    .sort({
      '_id': -1
    })
    .limit(10)
    .exec()
    .then((DataEntity) => {
      if (DataEntity) {
        res.json({
          status: '1',
          msg: '',
          result: DataEntity
        })
      } else {
        res.json({
          status: '0',
          msg: '没有DataEntity',
          result: ''
        })
      }
    })
})
module.exports = router