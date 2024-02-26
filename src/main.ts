import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs/promises'
import * as tmp from 'tmp'
import { ArgumentBuilder } from '@akiojin/argument-builder'

function GetBuildTarget(): string
{
  const buildTarget = core.getInput('build-target').toLowerCase()

  switch (buildTarget) {
  default:
      return buildTarget
  case 'ios':
  case 'iphone':
      return 'ios'
  case 'android':
      return 'android'
  case 'windows':
  case 'win':
  case 'win64':
      return 'windows'
  case 'mac':
  case 'macos':
  case 'osx':
  case 'osxuniversal':
  case 'maccatalyst':
      return 'maccatalyst'
  }
}

async function GetDisplayVersion(): Promise<string>
{
  if (core.getInput('display-version')) {
    return core.getInput('display-version')
  }

  if (!core.getInput('project')) {
    core.warning('Project file is not specified. Defaulting to 1.0.0')
    return '1.0.0'
  }

  var contents = await fs.readFile(core.getInput('project'), { encoding: "utf8" })

  core.startGroup('Read project file')
  core.info(contents)
  core.endGroup()

  var displayVersion = contents.match(/<ApplicationDisplayVersion>(.*)<\/ApplicationDisplayVersion>/)

  if (!displayVersion) {
    core.warning('ApplicationDisplayVersion is not specified. Defaulting to 1.0.0')
    return '1.0.0'
  }

  core.info(displayVersion[0])
  core.info(displayVersion[1])

  return displayVersion[1]
}

async function GetDefaultConfiguration(): Promise<ArgumentBuilder>
{
  const builder = new ArgumentBuilder()
    .Append('publish')
    .Append('--configuration', core.getInput('configuration'))
    .Append('--verbosity', core.getInput('verbosity'))
    .Append('--framework', `${core.getInput('framework')}-${GetBuildTarget()}`)
    .Append('-p:ArchiveOnBuild=true')
    .Append(`-p:ApplicationDisplayVersion="${await GetDisplayVersion()}"`)
    .Append(`-p:ApplicationVersion=${core.getInput('version')}`)

  if (core.getInput('project')) {
    builder.Append(core.getInput('project'))
  }

  if (core.getInput('output')) {
    builder.Append('--output', core.getInput('output'))
  }

  if (core.getInput('app-id')) {
    builder.Append(`-p:ApplicationId="${core.getInput('app-id')}"`)
  }

  if (core.getInput('title')) {
    builder.Append(`-p:ApplicationTitle="${core.getInput('title')}"`)
  }

  return builder
}

async function GetiOSConfiguration(): Promise<ArgumentBuilder>
{
  const builder = await GetDefaultConfiguration()

  if (core.getInput('codesign-key')) {
    return builder
      .Append('-p:RuntimeIdentifier=ios-arm64')
      .Append(`-p:CodesignKey="${core.getInput('codesign-key')}"`)
      .Append(`-p:CodesignProvision="${core.getInput('codesign-provision')}"`)
  } else {
    return builder
      .Append('-p:RuntimeIdentifier=ios-arm64')
  }
}

async function GetAndroidConfiguration(): Promise<ArgumentBuilder>
{
  const builder = await GetDefaultConfiguration()

  if (!core.getInput('android-signing-keystore') && core.getInput('android-signing-keystore-file')) {
    builder.Append('-p:AndroidKeyStore=false')
  } else {
    let keystore = core.getInput('android-signing-keystore-file')

    // android-signing-keystore が指定されている場合は優先的に割り当てる
    if (core.getInput('android-signing-keystore')) {
      keystore = tmp.tmpNameSync()
      await fs.writeFile(keystore, Buffer.from(core.getInput('android-signing-keystore'), 'base64'))
    }

    builder
      .Append('-p:AndroidKeyStore=false')
      .Append(`-p:AndroidSigningKeyStore="${keystore}"`)
      .Append(`-p:AndroidSigningStorePass="${core.getInput('android-signing-store-pass')}"`)
    
    if (core.getInput('android-signing-key-alias')) {
      builder.Append(`-p:AndroidSigningKeyAlias="${core.getInput('android-signing-key-alias')}"`)
    }

    if (core.getInput('android-signing-key-pass')) {
      builder.Append(`-p:AndroidSigningKeyPass="${core.getInput('android-signing-key-pass')}"`)
    } else {
      builder.Append(`-p:AndroidSigningKeyPass="${core.getInput('android-signing-store-pass')}"`)
    }
  }

  return builder
}

async function GetBuildConfiguration(): Promise<ArgumentBuilder>
{
  switch (GetBuildTarget()) {
  case 'ios':
    return GetiOSConfiguration()
  case 'android':
    return await GetAndroidConfiguration()
  default:
    return GetDefaultConfiguration()
  }
}

async function Build(): Promise<void>
{
  const builder = await GetBuildConfiguration()

  if (core.getInput('additional-arguments')) {
    builder.Append(core.getInput('additional-arguments'))
  }

  core.startGroup('Run dotnet build')
  await exec.exec('dotnet', builder.Build())
  core.endGroup()
}

async function Run(): Promise<void> 
{
  try {
    if (!core.getInput('framework')) {
      throw Error('Framework is required');
    }

    await Build()
  } catch (ex: any) {
    core.setFailed(ex.message);
  }
}

Run()
