# 云开发数据库索引

## members 集合

### 必需索引
```json
{
  "name": "fatherId_index",
  "key": { "fatherId": 1 }
}
{
  "name": "motherId_index",
  "key": { "motherId": 1 }
}
{
  "name": "generation_index",
  "key": { "generation": 1 }
}
{
  "name": "name_index",
  "key": { "name": 1 }
}
{
  "name": "userId_index",
  "key": { "userId": 1 },
  "unique": true,
  "sparse": true
}
```

### 复合索引
```json
{
  "name": "gender_generation_index",
  "key": { "gender": 1, "generation": 1 }
}
```

## users 集合

```json
{
  "name": "openid_index",
  "key": { "_openid": 1 },
  "unique": true
}
```

---

# 数据库权限设置

## members 集合
- 所有用户可读
- 创建者可写自己的记录
- 管理员可写所有

## users 集合
- 用户自己可读
- 用户自己可写

---

# 云开发环境变量

在 app.js 中替换 `YOUR_CLOUD_ENV_ID` 为实际的环境 ID
