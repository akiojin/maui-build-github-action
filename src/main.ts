import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { ArgumentBuilder } from '@akiojin/argument-builder'

function GetBuildTarget(): string
{
  return core.getInput('build-target').toLowerCase()
}

function GetDefaultConfiguration(): ArgumentBuilder
{
  const builder = new ArgumentBuilder()
    .Append('publish')
    .Append('--configuration', core.getInput('configuration'))
    .Append('--verbosity', core.getInput('verbosity'))
    .Append('--framework', `${core.getInput('framework')}-${GetBuildTarget()}`)
    .Append('-p:ArchiveOnBuild=true')
    .Append('-p:ApplicationVersion', core.getInput('version'))

  if (core.getInput('project')) {
    builder.Append(core.getInput('project'))
  }

  if (core.getInput('output')) {
    builder.Append('--output', core.getInput('output'))
  }

  if (core.getInput('app-id')) {
    builder.Append('-p:ApplicationId', core.getInput('app-id'))
  }

  if (core.getInput('display-version')) {
    builder.Append('-p:ApplicationDisplayVersion', core.getInput('display-version'))
  }

  if (core.getInput('title')) {
    builder.Append('-p:ApplicationTitle', core.getInput('title'))
  }

  return builder
}

function GetiOSConfiguration(): ArgumentBuilder
{
  return GetDefaultConfiguration()
    .Append('-p:RuntimeIdentifier=ios-arm64')
    .Append(`-p:CodesignKey=${core.getInput('codesign-key')}`)
    .Append(`-p:CodesignProvision=${core.getInput('codesign-provision')}`)
}

function GetAndroidConfiguration(): ArgumentBuilder
{
  const builder = GetDefaultConfiguration()

  if (core.getInput('android-signing-keystore')) {
    builder
      .Append('-p:AndroidKeyStore=false')
      .Append(`-p:AndroidSigningKeyStore=${core.getInput('android-signing-keystore')}`)
      .Append(`-p:AndroidSigningStorePass=${core.getInput('android-signing-store-pass')}`)
    
    if (core.getInput('android-signing-key-alias')) {
      builder.Append(`-p:AndroidSigningKeyAlias=${core.getInput('android-signing-key-alias')}`)
    }

    if (core.getInput('android-signing-key-pass')) {
      builder.Append(`-p:AndroidSigningKeyPass=${core.getInput('android-signing-key-pass')}`)
    } else {
      builder.Append(`-p:AndroidSigningKeyPass=${core.getInput('android-signing-store-pass')}`)
    }
  } else {
    builder.Append('-p:AndroidKeyStore=false')
  }

  return builder
}

function GetBuildConfiguration(): ArgumentBuilder
{
  switch (GetBuildTarget()) {
  case 'ios':
    return GetiOSConfiguration()
  case 'android':
    return GetAndroidConfiguration()
  default:
    return GetDefaultConfiguration()
  }
}

async function Build(): Promise<void>
{
  const builder = GetBuildConfiguration()

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
