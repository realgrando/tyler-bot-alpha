---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Study"').where(p => p.Class === 'classSubject' || (p.Class === 'classZettel' && p.Subtype === 'moc'))
  path: ''
  id: zetPar
- name: Source_Ref
  type: MultiFile
  options: {}
  path: ''
  id: zetSrc
- name: Subtype
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': atomic
      '2': moc
  path: ''
  id: zetSub
- name: Maturity
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': seed
      '2': budding
      '3': evergreen
  path: ''
  id: zetMat
- name: Anki_Deck
  type: Input
  options: {}
  path: ''
  id: zetAdk
- name: Anki_Sync
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': none
      '2': pending
      '3': synced
  path: ''
  id: zetAsy
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: zetCnv
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
- zetPar
- zetSrc
- zetSub
- zetMat
- zetAdk
- zetAsy
- zetCnv
---
