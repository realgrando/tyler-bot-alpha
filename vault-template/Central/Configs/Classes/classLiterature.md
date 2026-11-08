---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Study/Sources"').where(p => ['classBook', 'classCourse', 'classMovie'].includes(p.Class))
  path: ''
  id: litPar
- name: Sequence
  type: Number
  options:
    defaultValue: '1'
  path: ''
  id: litSeq
- name: Subtype
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': text
      '2': visual
  path: ''
  id: litSub
- name: Anki_Sync
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': none
      '2': pending
      '3': synced
  path: ''
  id: litAnk
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: litCnv
version: '4.0'
limit: 20
mapWithTag: false
icon: package
tagNames: null
filesPaths: null
bookmarksGroups: null
excludes: null
extends: classBase
savedViews: []
favoriteView: null
fieldsOrder:
- litPar
- litSeq
- litSub
- litAnk
- litCnv
---
