import { fromCloudDoc, toCloudDoc } from './cloud'
import type { AppState } from './types'

// A text code that carries all progress between the Android app and the
// claude.ai version, which keep separate storage. Compressed so it fits
// comfortably in the clipboard: "JLA1." + base64 of gzipped JSON, or
// "JLA0." + base64 of plain JSON where compression isn't available.

const GZIP = 'JLA1.'
const PLAIN = 'JLA0.'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function encodeTransfer(state: AppState): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(toCloudDoc(state)))
  if (typeof CompressionStream === 'function') return GZIP + toBase64(await pipe(json, new CompressionStream('gzip')))
  return PLAIN + toBase64(json)
}

export async function decodeTransfer(code: string): Promise<AppState> {
  const text = code.replace(/\s+/g, '')
  let json: Uint8Array
  if (text.startsWith(GZIP)) {
    if (typeof DecompressionStream !== 'function') throw new Error('This browser can’t unpack that code.')
    json = await pipe(fromBase64(text.slice(GZIP.length)), new DecompressionStream('gzip'))
  } else if (text.startsWith(PLAIN)) {
    json = fromBase64(text.slice(PLAIN.length))
  } else {
    throw new Error('That isn’t a progress code. It should start with JLA.')
  }
  return fromCloudDoc(JSON.parse(new TextDecoder().decode(json)))
}
