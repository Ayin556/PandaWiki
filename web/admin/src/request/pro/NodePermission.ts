/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import httpRequest, { ContentType, RequestParams } from "./httpClient";
import {
  DomainResponse,
  GetApiProV1NodePermissionParams,
  GithubComChaitinPandaWikiProApiNodeV1NodePermissionEditReq,
  GithubComChaitinPandaWikiProApiNodeV1NodePermissionEditResp,
  GithubComChaitinPandaWikiProApiNodeV1NodePermissionResp,
} from "./types";

/**
 * @description 文档授权信息获取
 *
 * @tags NodePermission
 * @name GetApiProV1NodePermission
 * @summary 文档授权信息获取
 * @request GET:/api/pro/v1/node/permission
 * @secure
 * @response `200` `(DomainResponse & {
    data?: GithubComChaitinPandaWikiProApiNodeV1NodePermissionResp,

})` OK
 */

export const getApiProV1NodePermission = (
  query: GetApiProV1NodePermissionParams,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainResponse & {
      data?: GithubComChaitinPandaWikiProApiNodeV1NodePermissionResp;
    }
  >({
    path: `/api/pro/v1/node/permission`,
    method: "GET",
    query: query,
    secure: true,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description 文档授权信息更新
 *
 * @tags NodePermission
 * @name PatchApiProV1NodePermissionEdit
 * @summary 文档授权信息更新
 * @request PATCH:/api/pro/v1/node/permission/edit
 * @secure
 * @response `200` `(DomainResponse & {
    data?: GithubComChaitinPandaWikiProApiNodeV1NodePermissionEditResp,

})` OK
 */

export const patchApiProV1NodePermissionEdit = (
  param: GithubComChaitinPandaWikiProApiNodeV1NodePermissionEditReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainResponse & {
      data?: GithubComChaitinPandaWikiProApiNodeV1NodePermissionEditResp;
    }
  >({
    path: `/api/pro/v1/node/permission/edit`,
    method: "PATCH",
    body: param,
    secure: true,
    type: ContentType.Json,
    format: "json",
    ...params,
  });
