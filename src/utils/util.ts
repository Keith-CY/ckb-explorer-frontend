import { ReactNode } from 'react'
import camelcaseKeys from 'camelcase-keys'
import JSBI from 'jsbi'
import BigNumber from 'bignumber.js'
import { scriptToAddress, addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { MAX_CONFIRMATION, TOKEN_EMAIL_SUBJECT, TOKEN_EMAIL_BODY, TOKEN_EMAIL_ADDRESS } from '../constants/common'
import { ContractHashTag, MainnetContractHashTags, TestnetContractHashTags } from '../constants/scripts'
import i18n from './i18n'
import { isMainnet } from './chain'

export const copyElementValue = (component: any) => {
  if (!component) return
  const selection = window.getSelection()
  if (selection) {
    const range = document.createRange()
    range.selectNodeContents(component)
    selection.removeAllRanges()
    selection.addRange(range)
    document.execCommand('Copy')
    selection.removeAllRanges()
  }
}

export const shannonToCkbDecimal = (value: BigNumber | string | number, decimal?: number) => {
  if (!value) return 0
  const bigValue = typeof value === 'string' || typeof value === 'number' ? new BigNumber(value) : value
  if (bigValue.isNaN()) {
    return 0
  }
  const num = bigValue.dividedBy(new BigNumber('1e8')).abs().toNumber()
  if (decimal) {
    if (bigValue.isNegative()) {
      return 0 - Math.floor(num * 10 ** decimal) / 10 ** decimal
    }
    return Math.floor(num * 10 ** decimal) / 10 ** decimal
  }
  if (bigValue.isNegative()) {
    return 0 - Math.floor(num)
  }
  return Math.floor(num)
}

export const shannonToCkb = (value: BigNumber | string | number): string => {
  if (!value) return '0'
  const bigValue = typeof value === 'string' || typeof value === 'number' ? new BigNumber(value) : value
  if (bigValue.isNaN()) {
    return '0'
  }
  const num = bigValue.dividedBy(new BigNumber('1e8'))
  if (num.abs().isLessThan(new BigNumber('1e-8'))) {
    return '0'
  }
  if (num.abs().isLessThan(new BigNumber('1e-6'))) {
    if (bigValue.mod(10).isEqualTo(0)) {
      return num.toFixed(7)
    }
    return num.toFixed(8)
  }
  return `${num}`
}

export const toCamelcase = <T>(object: any): T | null => {
  try {
    return JSON.parse(
      JSON.stringify(
        camelcaseKeys(object, {
          deep: true,
        }),
      ),
    ) as T
  } catch (error) {
    console.error(error)
  }
  return null
}

export const formatConfirmation = (confirmation: number) => {
  if (confirmation > MAX_CONFIRMATION) {
    return `${MAX_CONFIRMATION}+ ${i18n.t('address.confirmations')}`
  }
  if (confirmation > 1) {
    return `${confirmation} ${i18n.t('address.confirmations')}`
  }
  return `${confirmation} ${i18n.t('address.confirmation')}`
}

export const isValidReactNode = (node: ReactNode) => {
  if (node instanceof Array) {
    return node.findIndex(item => !!item) > -1
  }
  return !!node
}

export const matchScript = (contractHash: string, hashType: string): ContractHashTag | undefined => {
  if (isMainnet()) {
    return MainnetContractHashTags.find(
      scriptTag => scriptTag.codeHashes.find(codeHash => codeHash === contractHash) && scriptTag.hashType === hashType,
    )
  }
  return TestnetContractHashTags.find(
    scriptTag => scriptTag.codeHashes.find(codeHash => codeHash === contractHash) && scriptTag.hashType === hashType,
  )
}

export const matchTxHash = (txHash: string, index: number | string): ContractHashTag | undefined => {
  if (isMainnet()) {
    return MainnetContractHashTags.find(codeHashTag => codeHashTag.txHashes.find(hash => hash === `${txHash}-${index}`))
  }
  return TestnetContractHashTags.find(codeHashTag => codeHashTag.txHashes.find(hash => hash === `${txHash}-${index}`))
}

export const udtSubmitEmail = () =>
  `mailto:${TOKEN_EMAIL_ADDRESS}?subject=${TOKEN_EMAIL_SUBJECT}&body=${TOKEN_EMAIL_BODY}`

export const deprecatedAddrToNewAddr = (addr: string) => {
  if (!addr.startsWith('ck')) {
    return addr
  }
  try {
    return scriptToAddress(addressToScript(addr), addr.startsWith('ckb'))
  } catch {
    return addr
  }
}

export const handleRedirectFromAggron = () => {
  const PREV_TESTNAME = 'aggron'
  const CURRENT_TESTNET = 'pudge'
  const testnetNameRegexp = new RegExp(`^/(${PREV_TESTNAME}|${CURRENT_TESTNET})`)
  if (testnetNameRegexp.test(window.location.pathname)) {
    const redirect = `${window.location.protocol}//${CURRENT_TESTNET}.${
      window.location.host
    }${window.location.pathname.replace(testnetNameRegexp, '')}`
    window.location.href = redirect
    return true
  }
  return false
}

export const handleNftImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = '/images/nft_placeholder.png'
}

export const patchMibaoImg = (url: string) => {
  const JINSE_ORIGIN = 'https://oss.jinse.cc'
  const NERVINA_ORIGIN = 'https://goldenlegend.oss-accelerate.aliyuncs.com'
  const MAD_ORIGIN = 'https://mad-api.nervina.cn'

  const NEW_MIBAO_ORIGIN = 'https://nft-box.s3.amazonaws.com'
  const NEW_MAD_ORIGIN = 'https://mad.digitalcompound.org'

  try {
    const u = new URL(url)
    if ([JINSE_ORIGIN, NERVINA_ORIGIN].includes(u.origin)) {
      return `${NEW_MIBAO_ORIGIN}${u.pathname}`
    }

    if ([MAD_ORIGIN].includes(u.origin)) {
      return `${NEW_MAD_ORIGIN}${u.pathname}`
    }

    return url
  } catch {
    return url
  }
}

/**
 *@link https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0017-tx-valid-since/0017-tx-valid-since.md#specification
 */
export const parseSince = (
  since: string,
): { base: 'absolute' | 'relative'; type: 'block' | 'epoch' | 'timestamp'; value: string } | null => {
  const s = JSBI.BigInt(since)
  if (JSBI.equal(s, JSBI.BigInt(0))) {
    return null
  }

  const relativeFlag = JSBI.signedRightShift(s, JSBI.BigInt(63))
  const metricFlag = JSBI.bitwiseAnd(JSBI.signedRightShift(s, JSBI.BigInt(61)), JSBI.BigInt(3))

  const value = JSBI.bitwiseAnd(s, JSBI.BigInt('0xffffffffffffff'))

  const base = relativeFlag.toString() === '0' ? 'absolute' : 'relative'

  switch (metricFlag.toString()) {
    case '0': {
      // use block number
      return {
        base,
        type: 'block',
        value: JSBI.add(value, JSBI.BigInt(1)).toString(),
      }
    }
    case '1': {
      // use epoch number with fraction
      const EFigures = JSBI.BigInt(0xffffff)
      const IFigures = JSBI.BigInt(0xffff)
      const LFigures = JSBI.BigInt(0xffff)
      const E = +JSBI.bitwiseAnd(s, EFigures)
      const I = +JSBI.bitwiseAnd(JSBI.signedRightShift(s, JSBI.BigInt(24)), IFigures)
      const L = +JSBI.bitwiseAnd(JSBI.signedRightShift(s, JSBI.BigInt(40)), LFigures)
      return {
        base,
        type: 'epoch',
        value: `${(E + (I + 1) / L).toFixed(2)}`,
      }
    }
    case '2': {
      // use median_timestamp
      return {
        base,
        type: 'timestamp',
        value: value.toString(),
      }
    }
    default: {
      throw new Error('invalid since')
    }
  }
}

export default {
  copyElementValue,
  shannonToCkb,
  toCamelcase,
  formatConfirmation,
  isValidReactNode,
  deprecatedAddrToNewAddr,
  handleRedirectFromAggron,
}
