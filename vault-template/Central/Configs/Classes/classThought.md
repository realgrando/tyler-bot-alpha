---
fields:
- name: Parent
  type: File
  options: {}
  path: ''
  id: thtPar
- name: Category
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': mental
      '2': personal
      '3': theology
      '4': relation
      '5': philosophy
  path: ''
  id: thtCat
- name: People
  type: MultiFile
  options:
    dvQueryString: dv.pages('"Central/Study/People"').where(p => p.Class === 'classPerson')
  path: ''
  id: thtPpl
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
- thtPar
- thtCat
- thtPpl
---